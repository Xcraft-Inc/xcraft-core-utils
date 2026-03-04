# 📘 xcraft-core-utils

## Aperçu

Le module `xcraft-core-utils` est une bibliothèque utilitaire centrale du framework Xcraft qui fournit un ensemble complet d'outils et de classes pour diverses opérations courantes. Il regroupe des utilitaires pour la manipulation de données, la cryptographie, la gestion de fichiers, les opérations asynchrones, la synchronisation, la mise en cache, les files d'attente de jobs, et bien plus encore.

## Sommaire

- [Structure du module](#structure-du-module)
- [Fonctionnement global](#fonctionnement-global)
- [Exemples d'utilisation](#exemples-dutilisation)
- [Interactions avec d'autres modules](#interactions-avec-dautres-modules)
- [Variables d'environnement](#variables-denvironnement)
- [Détails des sources](#détails-des-sources)

## Structure du module

Le module expose une collection d'utilitaires organisés par domaine fonctionnel :

- **Collecteurs et agrégateurs** : `ArrayCollector`, `MapAggregator`, `EventDebouncer`
- **Traitement par lots** : `batch`, `Batcher`, `JobQueue`
- **Cryptographie et hachage** : `crypto`, `fileCrypto`, `hash`
- **Manipulation de fichiers** : `files`, `json`, `yaml`, `zippy`
- **Utilitaires système** : `os`, `modules`, `whereIs`
- **Programmation** : `js`, `reflect`, `propTypes`
- **Réseau** : `RestAPI`
- **Concurrence** : `locks`, `CursorPump`
- **Cache et performance** : `RankedCache`
- **Manipulation de chaînes** : `string`, `regex`
- **Logging** : `log`

## Fonctionnement global

Ce module agit comme une boîte à outils centralisée pour l'écosystème Xcraft. Chaque utilitaire est conçu pour être autonome tout en s'intégrant parfaitement avec les autres composants du framework. Les utilitaires supportent les patterns asynchrones avec [gigawatts] et sont optimisés pour les performances dans un environnement distribué.

Le module ne contient pas d'acteurs Elf ou Goblin : il s'agit uniquement d'une librairie utilitaire importée par d'autres modules.

## Exemples d'utilisation

### Collecte de données avec ArrayCollector

```javascript
const {ArrayCollector} = require('xcraft-core-utils');

const collector = new ArrayCollector(resp, 100, async (entries, resp) => {
  // Traitement des données collectées par clé
  for (const [key, values] of Object.entries(entries)) {
    console.log(`Clé: ${key}`, values);
  }
});

collector.grab('entityA', [{id: 1}]);
collector.grab('entityA', [{id: 2}]);
collector.grab('entityB', [{id: 3}]);
// La fonction onCollect est déclenchée après 100ms maximum
```

### Gestion de files d'attente avec JobQueue

```javascript
const {JobQueue} = require('xcraft-core-utils');

const runner = function* (job, next) {
  console.log(`Traitement du job ${job.id}`);
  yield setTimeout(next, 1000);
};

const queue = new JobQueue('processing', runner, 3, {
  priorityGroup: 'highPrio',
  waitOn: ['lowPrio'],
});
queue.push({id: 'job-1', payload: 'example'});
```

### Cryptographie et hachage

```javascript
const {crypto, hash} = require('xcraft-core-utils');

// Génération de mots de passe sécurisés
const password = crypto.randomPassword(16);

// Entier aléatoire cryptographiquement sûr
const roll = crypto.randomInt(1, 6);

// Hachage déterministe d'un objet
const objectHash = hash.computeHash({user: 'john', role: 'admin'});
```

### Client REST

```javascript
const {RestAPI} = require('xcraft-core-utils');

class MyApi extends RestAPI {
  constructor() {
    super(30000, {Authorization: 'Bearer token'});
  }

  async getUsers() {
    return this._get('https://api.example.com/users');
  }

  async streamResults() {
    const stream = await this._getStream('https://api.example.com/stream');
    if (stream.error) throw stream.error;
    for await (const item of stream) {
      console.log(item);
    }
  }
}
```

### Synchronisation avec locks

```javascript
const {locks} = require('xcraft-core-utils');

// Mutex simple
const mutex = new locks.Mutex();
yield mutex.lock();
try {
  // Section critique
} finally {
  mutex.unlock();
}

// Mutex par clé (GetMutex global)
yield locks.getMutex.lock('resource-id');
try {
  // Accès exclusif à la ressource 'resource-id'
} finally {
  locks.getMutex.unlock('resource-id');
}

// Exécution coalescente : seul le premier et le dernier appel concurrent s'exécutent
const executor = new locks.CoalescingExecutor();
await executor.run(async () => expensiveOperation());
```

### Traitement par lots avec Batcher

```javascript
const {Batcher} = require('xcraft-core-utils');

const batcher = new Batcher(
  async () => db.beginTransaction(),
  async (count) => db.commit(),
  500, // commit tous les 500 éléments
  5000 // ou après 5s d'inactivité
);

await batcher.start();
for (const record of records) {
  await db.insert(record);
  const shouldContinue = await batcher.bump();
  if (!shouldContinue) break;
}
await batcher.stop();
```

### Cache LRU avec RankedCache

```javascript
const {RankedCache} = require('xcraft-core-utils');

const cache = new RankedCache(100); // max 100 entrées
cache.on('out', (item) => {
  console.log('Élément évincé:', item.payload);
});

const item = cache.rank({id: 'style-1', css: '...'});
// Promouvoir un élément existant
cache.rank(item);
```

## Interactions avec d'autres modules

- **[xcraft-core-log]** : Utilisé pour le logging dans `JobQueue` et d'autres utilitaires
- **[xcraft-core-fs]** : Intégré pour les opérations sur le système de fichiers dans `batch` et `modules`
- **[xcraft-core-busclient]** : Utilisé par `JobQueue` pour les notifications d'événements sur le bus Xcraft
- **[xcraft-traverse]** : Utilisé pour la traversée d'objets complexes dans `hash`, `json` et `modules`
- **[gigawatts]** : Support des générateurs et fonctions asynchrones dans les classes principales

### Variables d'environnement

| Variable  | Description                                                                     | Exemple                         | Valeur par défaut |
| --------- | ------------------------------------------------------------------------------- | ------------------------------- | ----------------- |
| `PATH`    | Chemin système utilisé par `whereIs` pour localiser les exécutables             | `/usr/bin:/bin`                 | Variable système  |
| `APPDATA` | Répertoire de données d'application sur Windows (utilisé par `os.getAppData()`) | `C:\Users\User\AppData\Roaming` | Variable système  |

## Détails des sources

### `arrayCollector.js`

Classe pour collecter des données par clés avec un mécanisme de throttling. Permet d'accumuler des données et de les traiter par lots à intervalles réguliers. Supporte les modes synchrone et asynchrone via le paramètre `async` du constructeur.

En mode synchrone, le callback `onCollect` est wrappé avec `gigawatts` pour supporter les générateurs. En mode asynchrone, il est appelé avec `await` directement.

#### Méthodes publiques

- **`grab(key, data)`** — Ajoute des données à la collection sous une clé spécifique (par concaténation) et déclenche le traitement throttlé.
- **`cancel()`** — Annule le traitement en attente (throttle en cours).

### `async.js`

Module exportant une instance singleton avec des utilitaires pour les opérations asynchrones qui évitent de bloquer la boucle d'événements principale.

#### Méthodes publiques

- **`mapReduce(keyFunc, valueFunc, list)`** — Réduit un tableau en map avec itération asynchrone. Utile pour les très grandes collections où chaque item est traité via une `Promise`, libérant la boucle d'événements entre les itérations.

### `batch.js`

Fonction utilitaire pour exécuter une action sur tous les fichiers d'un répertoire de manière récursive.

#### Méthodes publiques

- **`run(filter, location, callbackAction)`** — Parcourt récursivement un répertoire et exécute `callbackAction` sur les fichiers dont le nom correspond au filtre regex. Les sous-répertoires sont traités récursivement.

### `batcher.js`

Gestionnaire de traitement par lots avec support de timeout et de seuils de déclenchement. Idéal pour optimiser les opérations coûteuses comme les transactions de base de données ou les écritures disque en regroupant les appels.

Le Batcher maintient une session entre `start()` et `stop()`. La méthode `bump()` incrémente le compteur et déclenche automatiquement un `stop()`/`start()` quand le seuil `batch` est atteint ou quand le timeout expire. La méthode `pump()` vérifie uniquement le timeout via un `setImmediate`.

#### Méthodes publiques

- **`start()`** — Démarre une nouvelle session : appelle `begin()` et arme le timer de timeout.
- **`bump()`** — Incrémente le compteur et déclenche un cycle commit/restart si le seuil ou le timeout est atteint. Retourne `false` si le batcher est en cours de destruction.
- **`pump()`** — Cède le contrôle via `setImmediate` puis déclenche un cycle si le timeout est atteint. Retourne `false` si destruction en cours.
- **`stop()`** — Termine la session courante en appelant `commit(count)` avec le nombre d'éléments traités.
- **`dispose()`** — Marque le batcher pour destruction ; les prochains appels à `bump()`/`pump()` déclencheront l'arrêt.

### `crypto.js`

Utilitaires cryptographiques pour le hachage, la génération de tokens et de mots de passe sécurisés. Utilise le module natif `node:crypto` pour garantir la qualité cryptographique des nombres aléatoires.

L'algorithme de génération d'entiers aléatoires (`randomInt`) utilise un rejet des valeurs hors plage pour garantir une distribution uniforme sans biais statistique.

#### Méthodes publiques

- **`md5(data)`** — Calcule le hash MD5 des données (retourne une chaîne hexadécimale).
- **`sha256(data)`** — Calcule le hash SHA256 des données (retourne une chaîne hexadécimale).
- **`genToken()`** — Génère un token UUID v4 sans tirets (32 caractères hexadécimaux).
- **`randomInt(min, max)`** — Génère un entier aléatoire cryptographiquement sûr dans `[min, max]`. Lève une erreur si la plage dépasse `2^31 - 1`.
- **`randomChar(chars)`** — Génère un caractère aléatoire à partir d'un ensemble (défaut : alphanumérique + symboles sans caractères ambigus).
- **`randomPassword(length=12, chars)`** — Génère un mot de passe aléatoire sécurisé de la longueur spécifiée.

### `cursorPump.js`

Wrapper pour les curseurs de base de données permettant de pomper les données de manière asynchrone avec [gigawatts]. Le curseur doit implémenter une méthode `next()` qui rejette sa promesse en fin de données.

#### Méthodes publiques

- **`toArray()`** — Consomme intégralement le curseur et retourne toutes les lignes dans un tableau.
- **`pump()`** — Récupère le prochain élément du curseur (lève une exception en fin de curseur).

### `eventDebouncer.js`

Classe pour débouncer l'envoi d'événements sur le bus Xcraft, évitant les envois trop fréquents pour un même topic. Un debouncer distinct est créé par topic à la première utilisation.

#### Méthodes publiques

- **`publish(topic, data)`** — Publie un événement avec debouncing automatique. Les appels répétés dans la fenêtre `wait` (défaut 1000ms) sont fusionnés, seul le dernier est envoyé.

### `file-crypto.js`

Utilitaires cryptographiques pour les fichiers, utilisant des streams pour éviter de charger le fichier entier en mémoire.

#### Méthodes publiques

- **`fileChecksum(filePath, options)`** — Calcule la somme de contrôle d'un fichier. `options.algorithm` (défaut `sha1`) et `options.encoding` (défaut `hex`) sont configurables. Lève une erreur si le chemin ne désigne pas un fichier.

### `files.js`

Utilitaires pour la détection de types de fichiers. Contient une base de données statique d'extensions couvrant audio, archives, images, documents, code source, vidéos, etc.

#### Méthodes publiques

- **`getFileFilter(filePath)`** — Retourne `{name, extensions}` basé sur l'extension du fichier. Retourne `{name: '?', extensions: [ext]}` si l'extension est inconnue.
- **`getMimeType(filePath)`** — Détecte le type MIME et le charset d'un fichier en utilisant libmagic (`@npcz/magic`). Retourne `{mime, charset}`. Préserve l'atime sur macOS et Linux.

### `hash.js`

Calcul de hash SHA256 déterministe pour des objets JavaScript complexes en traversant récursivement toutes les feuilles de l'arbre d'objets.

Seules les valeurs de type `number`, `string` et `boolean` contribuent au hash. Les chaînes vides sont remplacées par `\0` pour les distinguer de `null`/`undefined` (qui sont ignorés).

#### Méthodes publiques

- **`computeHash(payload)`** — Calcule un hash SHA256 hexadécimal d'un objet JavaScript en traversant récursivement ses propriétés feuilles.

### `job-queue.js`

Système de files d'attente avancé avec support de priorités, limitations de parallélisme, gestion des dépendances entre groupes et mécanismes de retry. Les jobs sont stockés dans une `Map` (préservation d'ordre d'insertion). L'exécution réelle est déléguée au singleton `runnerInstance`.

Les notifications de débit sont émises sur l'événement `<job-queue.sampled>` via le bus Xcraft, avec throttling à 500ms.

#### Méthodes publiques

- **`push(job)`** — Ajoute un job à la file d'attente (le job doit avoir une propriété `id`). Planifie une exécution via `setTimeout(..., 0)`.
- **`dispose()`** — Nettoie la file : émet l'événement `<job-queue.disposed>` et remet le compteur de samples à zéro.

### `js.js`

Utilitaires légers pour l'introspection de fonctions JavaScript.

#### Méthodes publiques

- **`isFunction(fn)`** — Vérifie si l'argument est une fonction.
- **`isGenerator(fn)`** — Vérifie si l'argument est une fonction générateur (`function*`).
- **`isAsync(fn)`** — Vérifie si l'argument est une fonction async.

### `json.js`

Utilitaires pour la manipulation de fichiers JSON et la transformation de structures de données.

#### Méthodes publiques

- **`fromFile(jsonFile)`** — ⚠️ Déprécié : utiliser `fse.readJSONSync` à la place.
- **`toFile(json, destFile)`** — ⚠️ Déprécié : utiliser `fse.writeJSONSync` à la place.
- **`dotKeysToObject(json)`** — Convertit les clés avec points en objets imbriqués. Exemple : `{"foo.bar": true}` devient `{foo: {bar: true}}`. Supporte les chemins imbriqués arbitrairement profonds et les tableaux.

### `locks.js`

Implémentations de primitives de synchronisation compatibles avec le pattern générateur [gigawatts].

- **`Mutex`** — Mutex simple. Méthodes : `*lock(next)` et `unlock()`. Propriété `isLocked`.
- **`RecursiveMutex`** — Mutex récursif : un même `owner` peut verrouiller plusieurs fois sans deadlock. `unlock(owner)` doit être appelé autant de fois que `lock(owner)`.
- **`Semaphore`** — Sémaphore avec valeur initiale configurable. Méthodes : `*wait(next)` et `signal()`.
- **`GetMutex`** (instance exportée comme `getMutex`) — Gestionnaire de mutex nommés : crée et détruit automatiquement les mutex par clé. Méthodes : `*lock(key)` et `unlock(key)`.
- **`CoalescingExecutor`** — Exécuteur coalescent : si plusieurs appels concurrents arrivent, seuls le premier et le dernier s'exécutent (les intermédiaires sont abandonnés). Méthode : `async run(work)`.

### `log.js`

Utilitaires de formatage et de décoration pour les logs avec support des couleurs ANSI, de l'indentation adaptative et de la détection de logs imbriqués. Utilisé par `xcraft-core-log`.

#### Méthodes publiques

- **`decorate(mode, prefix, mod, log, maxWidth, stripBegin)`** — Formate un message de log avec alignement dynamique, retour à la ligne automatique selon la largeur du terminal, et détection des logs embarqués.
- **`graffiti(text, callback)`** — Génère du texte ASCII art avec la police Graffiti (via `figlet`) et colorise les caractères `_`, `/`, `\` en vert/gris.
- **`getIndent()`** — Retourne la valeur d'indentation globale courante.
- **`computeIndent(prefix, mod)`** — Calcule le nombre d'espaces nécessaires pour aligner les messages et met à jour l'indentation globale si nécessaire.

### `mapAggregator.js`

Classe pour agréger des données dans une structure de map imbriquée avec throttling. Contrairement à `ArrayCollector`, `MapAggregator` écrase les valeurs existantes plutôt que de les concaténer.

#### Méthodes publiques

- **`put(keys, data)`** — Ajoute `data` dans la map en suivant le chemin `keys` (tableau ou chaîne avec points). Déclenche le throttle de libération.
- **`release()`** — Force la libération immédiate des données agrégées vers le callback `onCollect`.

### `modules.js`

Utilitaires pour la gestion des modules et configurations d'applications Xcraft avec support des variantes de déploiement et des surcharges de configuration.

La fonction `extractForEtc` gère les surcharges `@appId` dans `app.json` pour fusionner les configurations multi-applications. Les valeurs `-0` dans les JSON de configuration sont des marqueurs spéciaux pour revenir aux valeurs par défaut du `config.js` de chaque module.

#### Méthodes publiques

- **`mergeOverloads(obj, overloads)`** — Fusionne `overloads` dans `obj` en préservant les tableaux (non-fusion récursive des arrays).
- **`extractForEtc(appDir, appId, variantId)`** — Extrait et fusionne la configuration d'une application pour `xcraft-core-etc`, en appliquant les surcharges de variante et les configs `@appId`.
- **`loadAppConfig(appId, appDir, configJson, variantId)`** — Charge récursivement la configuration d'une application et de toutes ses hordes.
- **`extractConfigDeps(libDir, configJson)`** — Extrait les dépendances de modules déclarées dans les configs serveur.
- **`extractAllDeps(appId, libDir, configJson)`** — Résout récursivement toutes les dépendances Xcraft d'une application.
- **`extractAllJs(libDir, modules)`** — Retourne la liste de tous les fichiers `.js` des modules spécifiés (hors `node_modules`, `test`, `species`).

### `os.js`

Utilitaire pour les chemins de données d'application multi-plateformes.

#### Méthodes publiques

- **`getAppData()`** — Retourne `%APPDATA%` sur Windows, `~/Library/Application Support` sur macOS, `~/.local/share` sur Linux.

### `prop-types.js`

Générateurs de PropTypes React avec support des types étendus du système de design Xcraft (couleurs, espacements, glyphes, types Nabu, etc.).

Le type `nabu` valide que la prop est soit une chaîne, un nombre, soit un objet avec `nabuId` ou `_type: 'translatableString'/'translatableMarkdown'` (supportant aussi les `Map`/`OrderedMap` Immutable.js).

#### Méthodes publiques

- **`makePropTypes(props)`** — Génère un objet `propTypes` React à partir d'une définition de propriétés Xcraft. Applique `.isRequired` si `prop.required` est vrai.
- **`makeDefaultProps(props)`** — Génère un objet `defaultProps` React à partir des `defaultValue` de la définition.

### `ranked-cache.js`

Cache LRU (Least Recently Used) basé sur une liste doublement chaînée avec émission d'événements lors de l'éviction. Les éléments les moins récemment utilisés migrent vers la tête de liste et sont évincés en premier quand la limite est atteinte.

Un `RankedCache` avec `limit <= 0` retourne toujours `null` sans stocker quoi que ce soit.

#### Méthodes publiques

- **`rank(item)`** — Ajoute un nouvel item (valeur brute ou `LinkedList.Item`) ou promeut un item existant d'un cran dans la liste. Émet `'out'` avec l'item évincé si la limite est atteinte.
- **`clear()`** — Vide entièrement le cache en émettant `'out'` pour chaque item.

### `reflect.js`

Utilitaires de réflexion pour l'introspection de code JavaScript.

`funcParams` gère correctement les valeurs par défaut complexes (expressions imbriquées, chaînes avec parenthèses), les commentaires, et les fonctions fléchées avec ou sans parenthèses.

#### Méthodes publiques

- **`funcParams(func)`** — Extrait les noms des paramètres d'une fonction sous forme de tableau de chaînes, en supprimant les valeurs par défaut et les commentaires.
- **`parseOptions(args)`** — Parse une chaîne d'options CLI en tableau en gérant les espaces échappés, les guillemets simples et doubles, et les guillemets imbriqués.

### `regex.js`

Utilitaires pour la manipulation d'expressions régulières avec support des patterns Axon et Xcraft.

#### Méthodes publiques

- **`toRegexp(value)`** — Convertit une chaîne en `RegExp` ancrée (`^...$`) ou retourne la valeur si c'est déjà un `RegExp`.
- **`toAxonRegExpStr(str)`** — Convertit une chaîne avec wildcards `*` en pattern regex pour le système de messagerie Axon.
- **`toXcraftRegExpStr(str)`** — Convertit une chaîne avec wildcards `*` et groupes `(...)` en pattern regex pour le bus Xcraft.

### `rest.js`

Client REST avancé basé sur [got] avec support des streams JSON, retry automatique sur HTTP 429 (avec respect du header `Retry-After`), et enrichissement des erreurs avec l'URL et le corps de la réponse.

Les méthodes de stream utilisent `JSONStream.parse('*')` pour émettre chaque élément d'un tableau JSON au fil de la réception. Les erreurs de stream sont capturées dans `stream.error` et doivent être testées explicitement après la consommation du stream.

#### Méthodes publiques

- **`_get(query)`** — Requête GET, retourne le body parsé.
- **`_getWithHeaders(query)`** — Requête GET, retourne `{body, headers}`.
- **`_post(query, payload, options={})`** — Requête POST avec payload JSON.
- **`_delete(query)`** — Requête DELETE.
- **`_patch(query, payload)`** — Requête PATCH avec payload JSON.
- **`_putForm(query, formData)`** — Requête PUT avec données de formulaire (sans header `content-type`).
- **`_getStream(query, json=true)`** — Retourne un stream GET ; si `json=true`, parse le JSON à la volée.
- **`_postStream(query, payload, json=true)`** — Retourne un stream POST avec payload JSON.
- **`_streamPostStream(query, stream, json=true)`** — Envoie un stream en corps de requête POST et retourne un stream de réponse.

### `runnerInstance.js`

Singleton global (via `Symbol.for`) qui orchestre l'exécution des `JobQueue`. Il gère le parallélisme, les groupes de priorité et les dépendances entre groupes. Son unicité est garantie même si le module est chargé plusieurs fois dans des contextes différents.

L'algorithme de priorité suspend les jobs d'une queue si un groupe listé dans `waitOn` est actuellement en cours d'exécution, avec retry configurable (`maxAttempt`, `waitDelay`).

### `string.js`

Utilitaires légers de manipulation de chaînes.

#### Méthodes publiques

- **`camelcasify(str)`** — Convertit les segments séparés par des points en camelCase (ex: `foo.bar` → `fooBar`).
- **`capitalize(str)`** — Met la première lettre en majuscule et le reste en minuscules.
- **`jsify(str)`** — Convertit les tirets en camelCase (ex: `foo-bar` → `fooBar`).

### `whereIs.js`

Utilitaire pour localiser des exécutables dans le `PATH` système.

#### Méthodes publiques

- **`whereIs(bin)`** — Recherche un exécutable dans chaque répertoire du `PATH` et retourne le premier chemin complet trouvé, ou `null` si absent.

### `yaml.js`

Utilitaires pour la manipulation de fichiers YAML via `js-yaml`.

#### Méthodes publiques

- **`fromFile(yamlFile)`** — Charge et parse un fichier YAML, retourne l'objet JavaScript correspondant.
- **`toFile(data, yamlFile)`** — Sérialise un objet en YAML et l'écrit dans un fichier (largeur de ligne 999 pour limiter les retours à la ligne).

### `zippy.js`

Utilitaire pour créer des archives ZIP à partir d'une liste de fichiers vers un stream de sortie Node.js, avec support du chiffrement par mot de passe.

Utilise `@zip.js/zip.js` avec conversion des streams Node.js en Web Streams API via `Readable.toWeb` et `Writable.toWeb`.

#### Méthodes publiques

- **`zippy(files, outputStream, options)`** — Crée une archive ZIP. `files` est un tableau de chemins absolus. `options` peut contenir `password` (string) et `zipCrypto` (boolean) pour le chiffrement.

## Licence

Ce module est distribué sous [licence MIT](./LICENSE).

[xcraft-core-log]: https://github.com/Xcraft-Inc/xcraft-core-log
[xcraft-core-fs]: https://github.com/Xcraft-Inc/xcraft-core-fs
[xcraft-core-busclient]: https://github.com/Xcraft-Inc/xcraft-core-busclient
[xcraft-traverse]: https://github.com/Xcraft-Inc/xcraft-traverse
[gigawatts]: https://github.com/Xcraft-Inc/gigawatts
[got]: https://github.com/sindresorhus/got

_Ce contenu a été généré par IA_
