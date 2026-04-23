use std::sync::{Arc, Mutex};
use tauri::{Emitter, Listener};

#[tauri::command]
fn open_file(path: String) -> Result<(), String> {
    open::that(path).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![open_file])
        .setup(|app| {
            let port_state = Arc::new(Mutex::new(None::<u16>));
            let port_state_clone = port_state.clone();
            let app_handle = app.handle().clone();

            // 1. Listen for Frontend Readiness
            app.listen_any("frontend-ready", move |_| {
                let p = *port_state_clone.lock().unwrap();
                if let Some(port) = p {
                    println!("Relaying port to frontend: {}", port);
                    app_handle.emit("backend-ready", port).unwrap();
                }
            });
            
            let app_handle_sidecar = app.handle().clone();
            let port_state_sidecar = port_state.clone();

            use tauri_plugin_shell::ShellExt;
            let sidecar_command = app.shell().sidecar("api-server");
            if let Ok(command) = sidecar_command {
                // Spawn the sidecar
                let (mut rx, mut _child) = command.spawn().expect("Failed to spawn sidecar");
                
                // Read from stdout to grab the PORT
                tauri::async_runtime::spawn(async move {
                    while let Some(event) = rx.recv().await {
                        match event {
                            tauri_plugin_shell::process::CommandEvent::Stdout(line) => {
                                let line_str = String::from_utf8_lossy(&line);
                                println!("Sidecar STDOUT: {}", line_str.trim());
                                if line_str.starts_with("PORT=") {
                                    if let Ok(port) = line_str.replace("PORT=", "").trim().parse::<u16>() {
                                        println!("!!! Python Sidecar successfully bound to port: {} !!!", port);
                                        
                                        // Save to state for relaying
                                        *port_state_sidecar.lock().unwrap() = Some(port);

                                        // Emit event to frontend (initial broadcast)
                                        app_handle_sidecar.emit("backend-ready", port).unwrap();
                                    }
                                }
                            }
                            tauri_plugin_shell::process::CommandEvent::Stderr(line) => {
                                println!("Sidecar STDERR: {}", String::from_utf8_lossy(&line).trim());
                            }
                            tauri_plugin_shell::process::CommandEvent::Terminated(payload) => {
                                println!("Sidecar terminated with code: {:?}", payload.code);
                            }
                            _ => {}
                        }
                    }
                });
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
