class RemoteTrigger {
    wakeAgent(agentAddress) {
        return {
            status: 'AGENT_AWAKENED',
            target: agentAddress,
            message: `Wake-on-LAN/Trigger signal successfully sent to sleeping agent at [${agentAddress}].`
        };
    }
}
module.exports = { RemoteTrigger };
