set -a          # export all variables automatically
. ./.env        # load .env
set +a


node serapi-restaurants.js
node join-restaurants.js
node generatePdf.js

git add "report-generated-$CURRENT_LETTER.html"
git commit -m "Generated PDF for letter $CURRENT_LETTER"
git push origin main