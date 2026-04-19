use std::sync::Mutex;
use tauri::Manager;

pub struct BackendPort(pub Mutex<Option<u16>>);

#[tauri::command]
fn get_backend_port(state: tauri::State<'_, BackendPort>) -> Option<u16> {
    *state.0.lock().unwrap()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            app.manage(BackendPort(Mutex::new(None)));
            let app_handle = app.handle().clone();

            use tauri_plugin_shell::ShellExt;
            let sidecar_command = app.shell().sidecar("api-server");
            if let Ok(mut command) = sidecar_command {
                // Spawn the sidecar
                let (mut rx, mut _child) = command.spawn().expect("Failed to spawn sidecar");
                
                // Read from stdout to grab the PORT
                tauri::async_runtime::spawn(async move {
                    while let Some(event) = rx.recv().await {
                        if let tauri_plugin_shell::process::CommandEvent::Stdout(line) = event {
                            let line_str = String::from_utf8_lossy(&line);
                            if line_str.starts_with("PORT=") {
                                if let Ok(port) = line_str.replace("PORT=", "").trim().parse::<u16>() {
                                    println!("Python Sidecar bound to port: {}", port);
                                    let state = app_handle.state::<BackendPort>();
                                    *state.0.lock().unwrap() = Some(port);
                                }
                            }
                        }
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_backend_port])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
