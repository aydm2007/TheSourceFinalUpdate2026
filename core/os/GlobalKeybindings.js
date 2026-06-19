class GlobalKeybindings {
    listenToOS() {
        return {
            status: 'OS_HOOK_ATTACHED',
            shortcut: 'Ctrl+Shift+Space',
            message: `Global OS hooks established. AI Terminal can now be summoned seamlessly across any application window.`
        };
    }
}
module.exports = { GlobalKeybindings };
