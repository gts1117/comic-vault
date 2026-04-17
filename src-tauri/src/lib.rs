// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
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
                                // Once we grab the port, we could store it in app state
                                // For now we just print it to terminal for visibility
                                println!("Python Sidecar {}", line_str.trim());
                            }
                        }
                    }
                });
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
