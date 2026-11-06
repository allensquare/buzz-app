//! Quits on SIGTERM as Quit does. Unhandled, the signal ends Buzz before
//! `shut_down` runs, and each agent, alone in its own process group, outlives
//! it with its input closed: Claude Code then cancels every remaining tool call
//! as if the owner had declined it, and keeps writing to the session the next
//! Buzz resumes.

use std::time::Duration;

use tauri::{AppHandle, Manager, Runtime};
use tokio::signal::unix::{signal, SignalKind};

use crate::host_process::HostProcesses;

/// How long Quit may take before a signal ends Buzz anyway.
const QUIT_GRACE: Duration = Duration::from_secs(10);

pub(crate) fn install<R: Runtime>(app: &AppHandle<R>) {
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let Ok(mut term) = signal(SignalKind::terminate()) else {
            eprintln!("Buzz cannot quit on SIGTERM");
            return;
        };
        term.recv().await;
        app.exit(0);
        // A second signal, or a Quit that does not finish, still stops the
        // agents before Buzz goes.
        let _ = tokio::time::timeout(QUIT_GRACE, term.recv()).await;
        app.state::<HostProcesses>().shutdown();
        // SAFETY: as after Mesh shutdown in `run`, skip only global destructors.
        unsafe { libc::_exit(128 + libc::SIGTERM) }
    });
}
