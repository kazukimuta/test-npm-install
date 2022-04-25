# Install

```json
npm i -S lsc-distribution-mail-processor
```

### update to the last minor update (ex. 0.4.1 → 0.4.2)

```json
npm update lsc-distribution-mail-processor
```

# Usage

```jsx
const { createAnalyser, createTransformer } = require('lsc-distribution-mail-processor')

// matches texts with any body and subject, containing '【注意】'
const match = createAnalyser({ subject: '【注意】', body: '' }); 
const isMatching = match( { subject: '【注意】サルの出没について', body: '....' }); // true or false

const transform = createTransformer('$d;$d;$d');
const newText = transform('line1\nline2\nline3\nline4'); // 'line1'
```

# Examples

### example text

```json
【注意】サルの出没について \some value\ 09
```

### condition regexp

```json
【注意】      => MATCHES
(サル|イノシシ)      => MATCHES
\\\\somevalue\\\\       => MATCHES (matches \some value\)
09$       => MATCHES
出没$       => NOT MATCHES
=4**=423<fsdlf2395hf28572923=347294%(%$(^)$(@#$K#:       => NOT MATCHES (incorrect regex syntax)

```

 + empty string ⇒ MATCHES

# Transformation commands

### delete lines (single line command)

```json
1d - delete the first line 
$d - delete the last line
2,4d - delete 2th, 3th and 4th line
$d;$d;$d - delete the last line 3 times
```

### multiline command

```json
1d
$d;$d
s/太郎鈴木/市長/
s/http/https/g
s/[0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]/xxx-xxxx/
```

1) delete first line

2) delete last line twice

3) replace 太郎鈴木 with 市長

4) replace all entries of  `http` with `https` (from v 0.4.2)

5) replace pattern `000-0000` (where 0 is digit) with `xxx-xxxx`
