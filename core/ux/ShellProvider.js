class ShellProvider {
    /**
     * Dynamically routes terminal commands to the correct OS shell,
     * ensuring cross-platform stability (Windows PowerShell vs Linux Bash).
     */
    routeCommand(command) {
        const platform = process.platform;
        let shellExe = 'bash';

        if (platform === 'win32') {
            shellExe = 'powershell.exe';
            // Wrap command for powershell
            command = `Invoke-Expression "${command.replace(/"/g, '`"')}"`;
        } else if (platform === 'darwin') {
            shellExe = 'zsh';
        }

        return {
            status: 'ROUTED',
            platform: platform,
            target_shell: shellExe,
            wrapped_command: command,
            message: `Command dynamically wrapped for ${shellExe}`
        };
    }
}

module.exports = { ShellProvider };
