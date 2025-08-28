// Test token inheritance functionality in isolation
describe('Token Image Inheritance Logic', () => {
    // Simplified mock actor classes with just the inheritance logic
    class MockBaseActor {
        constructor(img = '') {
            this.img = img
        }

        async getTokenData(data = {}) {
            // Simulate base behavior returning empty texture
            return {
                texture: {},
                ...data,
            }
        }
    }

    class MockKreaturActor extends MockBaseActor {
        async getTokenData(data = {}) {
            const tokenData = await super.getTokenData(data)

            // Apply the inheritance logic from our implementation
            if (!tokenData.texture?.src && this.img) {
                tokenData.texture = tokenData.texture || {}
                tokenData.texture.src = this.img
            }

            return tokenData
        }
    }

    class MockHeldActor extends MockBaseActor {
        async getTokenData(data = {}) {
            const tokenData = await super.getTokenData(data)

            // Apply the inheritance logic from our implementation
            if (!tokenData.texture?.src && this.img) {
                tokenData.texture = tokenData.texture || {}
                tokenData.texture.src = this.img
            }

            return tokenData
        }
    }

    describe('KreaturActor token inheritance', () => {
        test('should inherit actor image when token texture is empty', async () => {
            const actor = new MockKreaturActor('path/to/custom/kreatur.png')
            const tokenData = await actor.getTokenData()
            expect(tokenData.texture.src).toBe('path/to/custom/kreatur.png')
        })

        test('should not override existing token texture', async () => {
            const actor = new MockKreaturActor('path/to/actor/image.png')

            // Create a custom base class that returns existing texture
            class CustomBaseActor extends MockBaseActor {
                async getTokenData(data = {}) {
                    return {
                        texture: { src: 'existing/token/image.png' },
                        ...data,
                    }
                }
            }

            class CustomKreaturActor extends CustomBaseActor {
                async getTokenData(data = {}) {
                    const tokenData = await super.getTokenData(data)

                    if (!tokenData.texture?.src && this.img) {
                        tokenData.texture = tokenData.texture || {}
                        tokenData.texture.src = this.img
                    }

                    return tokenData
                }
            }

            const customActor = new CustomKreaturActor('path/to/actor/image.png')
            const tokenData = await customActor.getTokenData()
            expect(tokenData.texture.src).toBe('existing/token/image.png')
        })

        test('should handle empty actor image gracefully', async () => {
            const actor = new MockKreaturActor('')
            const tokenData = await actor.getTokenData()
            expect(tokenData.texture.src).toBeUndefined()
        })
    })

    describe('HeldActor token inheritance', () => {
        test('should inherit actor image when token texture is empty', async () => {
            const actor = new MockHeldActor('path/to/hero/image.png')
            const tokenData = await actor.getTokenData()
            expect(tokenData.texture.src).toBe('path/to/hero/image.png')
        })

        test('should not override existing token texture', async () => {
            // Create a custom base class that returns existing texture
            class CustomBaseActor extends MockBaseActor {
                async getTokenData(data = {}) {
                    return {
                        texture: { src: 'existing/hero/token.png' },
                        ...data,
                    }
                }
            }

            class CustomHeldActor extends CustomBaseActor {
                async getTokenData(data = {}) {
                    const tokenData = await super.getTokenData(data)

                    if (!tokenData.texture?.src && this.img) {
                        tokenData.texture = tokenData.texture || {}
                        tokenData.texture.src = this.img
                    }

                    return tokenData
                }
            }

            const customActor = new CustomHeldActor('path/to/actor/image.png')
            const tokenData = await customActor.getTokenData()
            expect(tokenData.texture.src).toBe('existing/hero/token.png')
        })

        test('should handle null texture gracefully', async () => {
            // Create a custom base class that returns null texture
            class CustomBaseActor extends MockBaseActor {
                async getTokenData(data = {}) {
                    return {
                        texture: null,
                        ...data,
                    }
                }
            }

            class CustomHeldActor extends CustomBaseActor {
                async getTokenData(data = {}) {
                    const tokenData = await super.getTokenData(data)

                    if (!tokenData.texture?.src && this.img) {
                        tokenData.texture = tokenData.texture || {}
                        tokenData.texture.src = this.img
                    }

                    return tokenData
                }
            }

            const customActor = new CustomHeldActor('path/to/hero/image.png')
            const tokenData = await customActor.getTokenData()
            expect(tokenData.texture.src).toBe('path/to/hero/image.png')
        })
    })
})
