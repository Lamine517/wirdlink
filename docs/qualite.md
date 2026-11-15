# Vérification et SonarQube

```sh
npm run test:coverage
npm run build
```

Karma exécute Jasmine dans Chrome Headless et génère HTML + LCOV dans `coverage/wirdlink/`.
SonarQube importe ce rapport via `sonar.javascript.lcov.reportPaths` ; il ne lance pas Jasmine.
Voir la [documentation SonarSource](https://docs.sonarsource.com/sonarqube-server/analyzing-source-code/test-coverage/javascript-typescript-test-coverage).

Le fichier `sonar-project.properties` prépare le scan de `src/` et distingue les `*.spec.ts`.
Aucune suppression, exclusion de code métier ou règle de couverture artificielle n'est ajoutée.
Après installation du scanner et configuration de `SONAR_HOST_URL` / `SONAR_TOKEN` dans
l'environnement, lancer `sonar-scanner` à la racine. Adapter `sonar.projectKey` à la clé réelle
si elle diffère de `wirdlink`. Ne pas committer de jeton.

Le Quality Gate dépend du serveur et de son profil de règles. Son exécution distante
n'est pas validée par les seuls tests locaux ; consigner le résultat du serveur lorsqu'il sera disponible.
