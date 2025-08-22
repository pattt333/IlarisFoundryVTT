export class CombatDialog extends Dialog {
    async getData() {
        // damit wird das template gefüttert
        return {
            distance_choice: CONFIG.ILARIS.distance_choice,
            rollModes: CONFIG.Dice.rollModes,
            trefferzonen: CONFIG.ILARIS.trefferzonen,
            item: this.item,
            actor: this.actor,
            mod_at: this.mod_at,
            choices_schips: CONFIG.ILARIS.schips_choice,
            checked_schips: '0',
            dialogId: (this.dialogId = `dialog-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 11)}`),
        }
    }

    activateListeners(html) {
        super.activateListeners(html)

        html.find('.angreifen').click((ev) => this._angreifenKlick(html))
        // Add expand/collapse functionality
        html.find('.maneuver-header').click((ev) => {
            const header = ev.currentTarget
            const grid = header.nextElementSibling
            const isCollapsed = header.classList.contains('collapsed')
            const text = header.querySelector('h4')

            header.classList.toggle('collapsed')
            grid.classList.toggle('collapsed')

            // Update text based on state
            text.textContent = isCollapsed ? 'Einklappen' : 'Ausklappen'
        })

        // Update has-value class when inputs change and handle zero damage mutual exclusion
        html.find('.maneuver-item input, .maneuver-item select').change((ev) => {
            const item = ev.currentTarget.closest('.maneuver-item')
            const hasValue = Array.from(item.querySelectorAll('input, select')).some((input) => {
                if (input.type === 'checkbox') return input.checked
                return input.value && input.value !== '0'
            })
            item.classList.toggle('has-value', hasValue)

            // Handle zero damage mutual exclusion for AngriffDialog and FernkampfAngriffDialog
            if (
                this.constructor.name === 'AngriffDialog' ||
                this.constructor.name === 'FernkampfAngriffDialog'
            ) {
                // Find the maneuver associated with this input
                const inputElement = ev.currentTarget
                const elementId = inputElement.id

                // Extract maneuver ID from element ID (format: manoeverIdFIELD-dialogId)
                const dialogIdPattern = `-${this.dialogId}`
                const fieldPattern = /(CHECKBOX|NUMBER|TREFFER_ZONE)/
                const manoeverId = elementId.replace(dialogIdPattern, '').replace(fieldPattern, '')

                const selectedManoever = this.item.manoever?.find((m) => m.id === manoeverId)

                if (selectedManoever && this.hasZeroDamageModification(selectedManoever)) {
                    let isSelected = false
                    if (inputElement.type === 'checkbox') {
                        isSelected = inputElement.checked
                    } else if (inputElement.type === 'number') {
                        isSelected = inputElement.value && inputElement.value !== '0'
                    }

                    this.handleZeroDamageMutualExclusion(html, selectedManoever, isSelected)
                }
            }
        })

        // Colorize numbers in maneuver labels
        this.colorizeManeuverNumbers(html)

        // Initialize zero damage mutual exclusion for AngriffDialog and FernkampfAngriffDialog
        if (
            this.constructor.name === 'AngriffDialog' ||
            this.constructor.name === 'FernkampfAngriffDialog'
        ) {
            // Check for initially selected zero damage maneuvers
            setTimeout(() => {
                this.initializeZeroDamageMutualExclusion(html)
            }, 100)
        }
    }

    colorizeManeuverNumbers(html) {
        // Apply to both maneuver labels and other labels in the dialog
        html.find('.maneuver-item label, .flexrow label').each((index, label) => {
            let text = label.textContent

            // Find all parentheses content
            text = text.replace(/(\([^)]+\))/g, (parenthesesContent) => {
                // Count positive and negative numbers/variables in this parentheses
                const positiveMatches = (parenthesesContent.match(/\+\s*(\d+|[A-Z]+)/g) || [])
                    .length
                const negativeMatches = (parenthesesContent.match(/\-\s*(\d+|[A-Z]+)/g) || [])
                    .length

                // Determine dominant color
                let dominantClass = ''
                if (negativeMatches > positiveMatches) {
                    dominantClass = 'maneuver-negative'
                } else if (positiveMatches > negativeMatches) {
                    dominantClass = 'maneuver-positive'
                }

                // Make the entire parentheses bold and colored
                if (dominantClass) {
                    return `<strong class="${dominantClass}">${parenthesesContent}</strong>`
                } else {
                    return `<strong>${parenthesesContent}</strong>`
                }
            })

            // Handle numbers/variables outside of parentheses
            text = text.replace(/([\+\-]\s*(\d+|[A-Z]+))(?![^<]*<\/strong>)/g, (match) => {
                const isPositive = match.includes('+')
                const cssClass = isPositive ? 'maneuver-positive' : 'maneuver-negative'
                return `<span class="${cssClass}">${match}</span>`
            })

            if (text !== label.textContent) {
                label.innerHTML = text
            }
        })
    }

    aufbauendeManoeverAktivieren() {
        let manoever = this.item.system.manoever
        let vorteile = this.actor.vorteil.kampf.map((v) => v.name)

        manoever.kwut = vorteile.includes('Kalte Wut')
    }

    /**
     * Check if a maneuver has ZERO_DAMAGE modifications
     * @param {Object} manoever - The maneuver object to check
     * @returns {boolean} - True if the maneuver has ZERO_DAMAGE modifications
     */
    hasZeroDamageModification(manoever) {
        if (!manoever.system || !manoever.system.modifications) {
            return false
        }

        return Object.values(manoever.system.modifications).some(
            (modification) => modification.type === 'ZERO_DAMAGE',
        )
    }

    /**
     * Get all zero damage maneuvers from the current item
     * @returns {Array} - Array of zero damage maneuvers
     */
    getZeroDamageManeuvers() {
        if (!this.item.manoever) {
            return []
        }

        return this.item.manoever.filter((manoever) => this.hasZeroDamageModification(manoever))
    }

    /**
     * Initialize zero damage mutual exclusion on dialog open
     * @param {jQuery} html - The HTML element of the dialog
     */
    initializeZeroDamageMutualExclusion(html) {
        const zeroDamageManeuvers = this.getZeroDamageManeuvers()

        if (zeroDamageManeuvers.length <= 1) {
            return // No need for mutual exclusion
        }

        // Check if any zero damage maneuver is already selected
        for (const manoever of zeroDamageManeuvers) {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            const element = html.find(`#${elementId}`)[0]

            if (element) {
                let isSelected = false
                if (manoever.inputValue.field === 'CHECKBOX') {
                    isSelected = element.checked
                } else if (manoever.inputValue.field === 'NUMBER') {
                    isSelected = element.value && element.value !== '0'
                }

                if (isSelected) {
                    this.handleZeroDamageMutualExclusion(html, manoever, true)
                    break
                }
            }
        }
    }

    /**
     * Handle mutual exclusion of zero damage maneuvers
     * @param {jQuery} html - The HTML element of the dialog
     * @param {Object} selectedManoever - The maneuver that was just selected
     * @param {boolean} isSelected - Whether the maneuver is now selected
     */
    handleZeroDamageMutualExclusion(html, selectedManoever, isSelected) {
        const zeroDamageManeuvers = this.getZeroDamageManeuvers()

        if (zeroDamageManeuvers.length <= 1) {
            return // No need for mutual exclusion if there's only one or no zero damage maneuvers
        }

        // Check if any zero damage maneuver is currently selected
        let anyZeroDamageSelected = false
        let selectedZeroDamageManoever = null

        for (const manoever of zeroDamageManeuvers) {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            const element = html.find(`#${elementId}`)[0]

            if (element) {
                let isCurrentlySelected = false
                if (manoever.inputValue.field === 'CHECKBOX') {
                    isCurrentlySelected = element.checked
                } else if (manoever.inputValue.field === 'NUMBER') {
                    isCurrentlySelected = element.value && element.value !== '0'
                }

                if (isCurrentlySelected) {
                    anyZeroDamageSelected = true
                    selectedZeroDamageManoever = manoever
                    break
                }
            }
        }

        // Apply mutual exclusion
        zeroDamageManeuvers.forEach((manoever) => {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            const element = html.find(`#${elementId}`)[0]
            const container = element?.closest('.maneuver-item')

            if (element && container) {
                if (anyZeroDamageSelected && manoever.id !== selectedZeroDamageManoever?.id) {
                    // Disable this maneuver and add tooltip
                    element.disabled = true
                    container.classList.add('zero-damage-disabled')

                    // Add or update tooltip
                    const tooltipText = `Kann nicht mit "${selectedZeroDamageManoever.name}" kombiniert werden (beide verursachen keinen Schaden)`
                    container.title = tooltipText
                } else {
                    // Enable this maneuver and remove tooltip
                    element.disabled = false
                    container.classList.remove('zero-damage-disabled')
                    container.removeAttribute('title')
                }
            }
        })
    }

    async manoeverAuswaehlen(html) {
        /* TODO: könnte das nicht direkt via template passieren für einen großteil der werte? 
        sodass ne form direkt die werte vom item ändert und keine update funktion braucht?
        dann wäre die ganze funktion hier nicht nötig.
        TODO: alle simplen booleans könnten einfach in eine loop statt einzeln aufgeschrieben werden
        */
        this.rollmode = this.item.system.manoever.rllm.selected

        this.item.manoever.forEach((manoever) => {
            const elementId = `${manoever.id}${manoever.inputValue.field}-${this.dialogId}`
            if (manoever.inputValue.field == 'CHECKBOX') {
                manoever.inputValue.value = html.find(`#${elementId}`)[0]?.checked || false
            } else {
                console.log(manoever.inputValue.name, html.find(`#${elementId}`)[0]?.value)
                manoever.inputValue.value = html.find(`#${elementId}`)[0]?.value || false
            }
        })
    }

    updateStatusMods() {
        /* aus gesundheit und furcht wird at- und vt_abzuege_mod
        berechnet.
        */
        // TODO: das ignorieren von Wunden ist nicht so gut gelöst,
        // da der Modifier wie hoch der Wundabzug ist einfach auf 0 gesetzt wird
        // deshalb wird hier der Modifier noch neu berechnet damit man den Vorteil von Kalter Wut zeigen kann
        this.at_abzuege_mod = 0

        if (
            this.actor.system.gesundheit.wundenignorieren &&
            this.actor.system.gesundheit.wunden > 2
        ) {
            const wundabzuege = (this.actor.system.gesundheit.wunden - 2) * 2
            this.text_at = this.text_at.concat(
                `Bonus durch Kalte Wut oder ähnliches: +${wundabzuege} (im Globalenmod verrechnet)\n`,
            )
        }
        this.at_abzuege_mod = this.actor.system.abgeleitete.globalermod
    }

    _updateSchipsStern(html) {
        const schipsOption =
            Number(html.find(`input[name="schips-${this.dialogId}"]:checked`)[0]?.value) || 0
        if (schipsOption !== 0 && this.actor.system.schips.schips_stern > 0) {
            this.actor.update({
                'system.schips.schips_stern': this.actor.system.schips.schips_stern - 1,
            })
        }
    }

    getDiceFormula(html, xd20_choice = 1) {
        let schipsOption =
            Number(html.find(`input[name="schips-${this.dialogId}"]:checked`)[0]?.value) || 0
        let text = ''
        let diceFormula = `${xd20_choice}d20${xd20_choice == 1 ? '' : 'dl1dh1'}`
        if (schipsOption == 0) {
            return `${xd20_choice}d20${xd20_choice == 1 ? '' : 'dl1dh1'}`
        }
        if (this.actor.system.schips.schips_stern == 0) {
            this.text_at = text.concat(`Keine Schips\n`)
            this.text_vt = text.concat(`Keine Schips\n`)
            return `${xd20_choice}d20${xd20_choice == 1 ? '' : 'dl1dh1'}`
        }

        if (schipsOption == 1) {
            this.text_at = text.concat(`Schips ohne Eigenheit\n`)
            this.text_vt = text.concat(`Schips ohne Eigenheit\n`)
            diceFormula = `${xd20_choice + 1}d20${xd20_choice == 1 ? '' : 'dh1'}${
                xd20_choice == 1 ? 'dl1' : 'dl2'
            }`
        }

        if (schipsOption == 2) {
            this.text_at = text.concat(`Schips mit Eigenschaft\n`)
            this.text_vt = text.concat(`Schips mit Eigenschaft\n`)
            diceFormula = `${xd20_choice + 2}d20${xd20_choice == 1 ? '' : 'dh1'}${
                xd20_choice == 1 ? 'dl2' : 'dl3'
            }`
        }
        return diceFormula
    }
}
