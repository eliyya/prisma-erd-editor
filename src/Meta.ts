export class Meta {
    #updateAt = Date.now()
    #createAt = Date.now()

    get updateAt() {
        return this.#updateAt
    }

    get createAt() {
        return this.#createAt
    }

    toJSON() {
        return {
            updateAt: this.#updateAt,
            createAt: this.#createAt,
        }
    }
}
