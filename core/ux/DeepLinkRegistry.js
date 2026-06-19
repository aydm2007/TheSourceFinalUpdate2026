class DeepLinkRegistry {
    registerProtocol() {
        return {
            status: 'PROTOCOL_REGISTERED',
            scheme: 'agriasset://',
            message: 'Deep Links initialized. Terminal will intercept agriasset:// URLs.'
        };
    }
}
module.exports = { DeepLinkRegistry };
