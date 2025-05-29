class Tokens {
    private static csrf: string = '';

    public static setCsrf(newCsrf: string) {
        this.csrf = newCsrf;
    }

    public static getCsrf() {
        return this.csrf;
    }
}

export default Tokens;