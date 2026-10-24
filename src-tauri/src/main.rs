#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{
    menu::{MenuBuilder, MenuItemBuilder},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, PhysicalPosition,
};

#[derive(Serialize)]
struct MoveResult {
    src: String,
    dest: Option<String>,
    error: Option<String>,
}

/// 把真实文件移动进目标文件夹。
/// 优先 rename；跨盘符失败时退回 复制+删除。重名自动追加 (2)(3)…
#[tauri::command]
fn move_files(paths: Vec<String>, dest_dir: String) -> Vec<MoveResult> {
    let dir = Path::new(&dest_dir);
    if let Err(e) = fs::create_dir_all(dir) {
        return paths
            .into_iter()
            .map(|p| MoveResult { src: p, dest: None, error: Some(e.to_string()) })
            .collect();
    }
    paths
        .into_iter()
        .map(|p| {
            let src_path = Path::new(&p);
            let Some(name) = src_path.file_name() else {
                return MoveResult { src: p, dest: None, error: Some("无效路径".into()) };
            };
            let mut dest = dir.join(name);
            if dest.exists() {
                let stem = src_path
                    .file_stem()
                    .map(|s| s.to_string_lossy().to_string())
                    .unwrap_or_default();
                let ext = src_path
                    .extension()
                    .map(|e| format!(".{}", e.to_string_lossy()))
                    .unwrap_or_default();
                let mut n = 2;
                loop {
                    let cand = dir.join(format!("{}({}){}", stem, n, ext));
                    if !cand.exists() {
                        dest = cand;
                        break;
                    }
                    n += 1;
                }
            }
            let result = fs::rename(src_path, &dest).or_else(|_| {
                fs::copy(src_path, &dest).and_then(|_| fs::remove_file(src_path))
            });
            match result {
                Ok(_) => MoveResult { src: p, dest: Some(dest.to_string_lossy().to_string()), error: None },
                Err(e) => MoveResult { src: p, dest: None, error: Some(e.to_string()) },
            }
        })
        .collect()
}

fn config_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("config.json"))
}

#[tauri::command]
fn load_config(app: tauri::AppHandle) -> String {
    config_path(&app)
        .and_then(|p| fs::read_to_string(p).map_err(|e| e.to_string()))
        .unwrap_or_default()
}

#[tauri::command]
fn save_config(app: tauri::AppHandle, json: String) -> Result<(), String> {
    let p = config_path(&app)?;
    fs::write(p, json).map_err(|e| e.to_string())
}

/// 用系统文件管理器打开文件夹
#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer").arg(&path).spawn().map_err(|e| e.to_string())?;
    #[cfg(target_os = "macos")]
    std::process::Command::new("open").arg(&path).spawn().map_err(|e| e.to_string())?;
    #[cfg(all(unix, not(target_os = "macos")))]
    std::process::Command::new("xdg-open").arg(&path).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

/// 休眠停靠：窗口滑到屏幕右缘，只露出 20px 挂扣
#[tauri::command]
fn dock_window(window: tauri::WebviewWindow, docked: bool) -> Result<(), String> {
    let monitor = window
        .current_monitor()
        .map_err(|e| e.to_string())?
        .ok_or("未找到显示器")?;
    let screen = monitor.size();
    let scale = monitor.scale_factor();
    let win = window.outer_size().map_err(|e| e.to_string())?;
    let margin = (28.0 * scale) as i32;
    let peek = (20.0 * scale) as i32;
    let x = if docked {
        screen.width as i32 - peek
    } else {
        screen.width as i32 - win.width as i32 - margin
    };
    let y = screen.height as i32 - win.height as i32 - margin;
    window
        .set_position(PhysicalPosition::new(x, y))
        .map_err(|e| e.to_string())
}

fn toggle_window(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        if win.is_visible().unwrap_or(false) {
            let _ = win.hide();
        } else {
            let _ = win.show();
            let _ = win.set_focus();
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // 初始位置：屏幕右下角
            let win = app.get_webview_window("main").unwrap();
            if let Ok(Some(m)) = win.current_monitor() {
                let screen = m.size();
                let scale = m.scale_factor();
                let ws = win.outer_size().unwrap();
                let margin = (28.0 * scale) as i32;
                let _ = win.set_position(PhysicalPosition::new(
                    screen.width as i32 - ws.width as i32 - margin,
                    screen.height as i32 - ws.height as i32 - margin,
                ));
            }

            // 系统托盘
            let toggle = MenuItemBuilder::with_id("toggle", "显示 / 隐藏").build(app)?;
            let quit = MenuItemBuilder::with_id("quit", "退出文件口袋").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&toggle, &quit]).build()?;
            TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("文件口袋")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "quit" => app.exit(0),
                    "toggle" => toggle_window(app),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_window(tray.app_handle());
                    }
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            move_files,
            load_config,
            save_config,
            open_folder,
            dock_window
        ])
        .run(tauri::generate_context!())
        .expect("运行文件口袋时出错");
}
