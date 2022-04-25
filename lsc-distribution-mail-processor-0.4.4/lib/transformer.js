const sed = require('sed-lite').sed;

const prepareText = (text) => {
    let lines = text.split('\n');
    lines = lines
        .map((s, index) => {
            if (s.trim().length === 0) {
                if (index + 1 === lines.length) {
                    return null;
                }
                return "";
            }
            return s;
        })
        .filter((s) => s !== null);
    return lines.join('\n');
}

const applySed = (sedProcessor, text) => {
    const lines = text.split('\n');
    return lines
        .map((s) => s.trim().length === 0 ? '' : s)
        .map((s, index) => sedProcessor(s, index, lines.length))
        .filter((s) => s !== null)
        .join('\n');
};

const createProcessor = (command) => {
    let res = /^s\/.+\/.*\/g?/.exec(command);
    if (res) {
        return sed(res[0]);
    }
    res = /^\/(.+)\/d$/.exec(command);
    if (res) {
        const stringRemoverRegex = new RegExp(res[1]);
        return (str) => {
            if (stringRemoverRegex.test(str)) {
                return null;
            }
            return str;
        };
    }
    res = /^(\d+|\$)(!?)d$/.exec(command);
    if (res) {
        const lineMatcher = res[1];
        const negate = res[2] === '!';
        return (str, index, lines) => {
            let matches = false;
            if (lineMatcher === '$') {
                matches = index + 1 === lines;
            } else {
                matches = index + 1 === parseInt(res[1]);
            }
            if (negate) {
                return matches ? str : null;
            } else {
                return matches ? null : str;
            }
        };
    }
    res = /^((\d*),(\d*))(!?)d$/.exec(command);
    if (res) {
        const negate = res[4] === '!';
        const from = parseInt(res[2]) || Number.MIN_VALUE;
        const to = parseInt(res[3]) || Number.MAX_VALUE;
        let matcher =  (index) => index >= from && index <= to;
        return (str, index) => {
            const matches = matcher(index + 1);
            if (negate) {
                return matches ? str : null;
            } else {
                return matches ? null : str;
            }
        };
    }
};


const transform = (mailBody, config) => {
    const processRegex = config.processRegEx;
    if (!processRegex) {
        return mailBody;
    }
    let result = prepareText(mailBody);
    processRegex.split(/[\n;]/).forEach((command) => {
        const processor = createProcessor(command);
        if (processor) {
            result = applySed(processor, result);
        }
    });
    return result;
};

module.exports = (transformationString) => {
    return (bodyText) => transform(bodyText, {
        processRegEx: transformationString,
    })
}
