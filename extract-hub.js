const fs = require('fs');
const html = fs.readFileSync('/Users/severinobione/Downloads/quiz-250-biblico.html', 'utf8');

// Extract the CSS styles related to the Hub view
const matchCss = html.match(/<style>([\s\S]*?)<\/style>/);
if (matchCss) {
  const css = matchCss[1];
  fs.writeFileSync('extracted_styles.css', css);
  console.log('CSS extracted');
}
