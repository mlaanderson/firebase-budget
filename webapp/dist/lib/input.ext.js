Object.defineProperty(HTMLInputElement, "supportsType", {
    get: () => {
        return (type) => {
            type = type.toLowerCase();
            try {
                var inp = document.createElement("input");
                inp.type = type;
                if (inp.type == type)
                    return true;
            }
            catch (e) {
            }
            return false;
        };
    }
});
