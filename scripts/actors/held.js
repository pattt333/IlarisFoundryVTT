import { IlarisActor } from './actor.js'

export class HeldActor extends IlarisActor {
    constructor(data, options) {
        // this is a workaround to force actor link to be set even when
        // created through proxy. remove the proxy and this constructor
        foundry.utils.mergeObject(data, {
            'prototypeToken.actorLink': true,
        })
        super(data, options)
    }

    async _preCreate(data, options, user) {
        // TDOO: this seems not to be executed when created from "new actor"
        // button. Looks like its bypassed by the proxy (remove proxy?)
        console.log('HeldActor._preCreate()')
        console.log(data)
        foundry.utils.mergeObject(data, {
            'prototypeToken.bar1': { attribute: 'gesundheit.hp' },
            'prototypeToken.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            'prototypeToken.displayBars': CONST.TOKEN_DISPLAY_MODES.ALWAYS,
            'prototypeToken.disposition': CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            'prototypeToken.name': data.name,
            'prototypeToken.actorLink': true,
        })
        if (!data.img) {
            data.img = 'systems/Ilaris/assets/images/token/kreaturentypen/humanoid.png'
        }
        data.prototypeToken.vision = true
        data.prototypeToken.actorLink = true
        data.prototypeToken.brightSight = 15
        data.prototypeToken.dimSight = 5
        await super._preCreate(data, options, user) // IlarisActor._preCreate() -> Actor._preCreate()
    }

    /**
     * Override token creation to inherit actor image when token image is empty
     */
    async getTokenData(data = {}) {
        const tokenData = await super.getTokenData(data)

        // If no texture source is explicitly set on the token, inherit from actor
        if (!tokenData.texture?.src && this.img) {
            tokenData.texture = tokenData.texture || {}
            tokenData.texture.src = this.img
        }

        return tokenData
    }

    /** @override */
    async prepareData() {
        // sieht jetzt gleich aus, kann in actor.js?
        super.prepareData()
        await this._initializeActor() // TODO: warum wird data überall durchgegeben, ist doch sowieso instanziert??
    }

    async _initializeActor() {
        // NOTE: sieht aus als wäre _initialize eine methode von Actor,
        // die man nicht einfach überschreiben sollte
        // daher umbenannt in initialiseActor
        console.log('init')
        console.log(this)
        this._sortItems(this) //Als erstes, darauf basieren Berechnungen
        this._calculatePWAttribute(this.system)
        this._calculateWounds(this.system) // muss vor _calculateAbgeleitete kommen (wegen globalermod)
        this._calculateFear(this.system) // muss vor _calculateAbgeleitete kommen (wegen globalermod)
        this._calculateWundschwellenRuestung(this)
        this._calculateModifikatoren(this.system)
        this._calculateAbgeleitete(this)
        this._calculateProfanFertigkeiten(this)
        this._calculateUebernaturlichFertigkeiten(this)
        this._calculateUebernaturlichTalente(this) //Nach Uebernatürliche Fertigkeiten
        await this._calculateKampf(this)
        this._calculateUebernatuerlichProbendiag(this)
    }
}
