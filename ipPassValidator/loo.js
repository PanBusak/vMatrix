const compareNestedJson = (a, b) => {
    const compareArrays = (arrayA, arrayB) => {
        const result = [];
        const setA = new Set(arrayA);
        const setB = new Set(arrayB);

        for (const item of arrayA) {
            if (setB.has(item)) {
                result.push({ name: item, status: "original" });
            } else {
                result.push({ name: item, status: "deleted" });
            }
        }

        for (const item of arrayB) {
            if (!setA.has(item)) {
                result.push({ name: item, status: "added" });
            }
        }

        return result;
    };

    const result = {};
    for (const key in a) {
        if (b.hasOwnProperty(key)) {
            if (Array.isArray(a[key]) && Array.isArray(b[key])) {
                result[key] = compareArrays(a[key], b[key]);
            } else {
                result[key] = a[key] === b[key] ? "original" : "modified";
            }
        } else {
            result[key] = "deleted";
        }
    }

    for (const key in b) {
        if (!a.hasOwnProperty(key)) {
            result[key] = "added";
        }
    }

    return result;
};

const jsonA = {
    "zvierata": ["rybka", "psik"],
    "naradie": ["kosa", "hrable"],
    "ludia": ["jano", "stevo"]
};

const jsonB = {
    "zvierata": ["psik", "macka"],
    "naradie": ["hrable", "lopata"],
    "ludia": ["jano", "peter"],
    "auta": ["ford"]
};

const output = compareNestedJson(jsonA, jsonB);
console.log(JSON.stringify(output, null, 2));

