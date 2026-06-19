class CompanionSprite {
    renderAvatar(emotion) {
        return {
            status: 'AVATAR_RENDERED',
            emotion: emotion,
            message: `Terminal ASCII Companion Sprite rendered with emotion: [${emotion}]. The Digital Soul is active.`
        };
    }
}
module.exports = { CompanionSprite };
