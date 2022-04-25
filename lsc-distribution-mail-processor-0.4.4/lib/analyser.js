function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const parseRegex = (str) => {
    try {
        return new RegExp(str);
    } catch (e) {
        return null;
    }
};

const matches = (parsedMail, subjectRegEx, bodyRegEx) => {
    let matches = true;

    if (subjectRegEx) {
        const regex = parseRegex(subjectRegEx);
        if (regex) {
            const subject = parsedMail.subject;
            matches = regex.test(subject);
        } else {
          matches = false;
        }
    } else {
      matches = false;
    }

    if (!matches) {
        return false;
    }

    if (bodyRegEx) {
        const regex = parseRegex(bodyRegEx);
        if (regex) {
            const body = parsedMail.body;
            matches = regex.test(body);
        } else {
          matches = false;
        }
    } else {
      matches = false;
    }

    return matches;

};

module.exports = ({bodyRegex, subjectRegex}) => {
    return (mail) => {
        const body = mail.body || '';
        const subject = mail.subject || '';

        return matches({
            body, subject,
        }, subjectRegex, bodyRegex)
    }
}
