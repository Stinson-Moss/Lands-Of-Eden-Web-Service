class Tokens {
    private static csrf: string = '';

    public static setCsrf(csrf: string) {
        this.csrf = csrf;
    }

    public static getCsrf() {
        return this.csrf;
    }
}

export default Tokens;