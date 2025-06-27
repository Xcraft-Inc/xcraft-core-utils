# 📘 xcraft-core-utils

## Aperçu

Le module `xcraft-core-utils` est une bibliothèque utilitaire centrale du framework Xcraft qui fournit un ensemble complet d'outils et de classes pour diverses opérations courantes. Il regroupe des utilitaires pour la manipulation de données, la cryptographie, la gestion de fichiers, les opérations asynchrones, la mise en cache, et bien plus encore.

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
- **Opérations asynchrones** : `async`

## Fonctionnement global

Ce module agit comme une boîte à outils centralisée pour l'écosystème Xcraft. Chaque utilitaire est conçu pour être autonome tout en s'intégrant parfaitement avec les autres composants du framework. Les utilitaires supportent les patterns asynchrones avec `gigawatts` et sont optimisés pour les performances dans un environnement distribué.

## Exemples d'utilisation

### Collecte de données avec ArrayCollector

```javascript
const {ArrayCollector} = require('xcraft-core-utils');

const collector = new ArrayCollector(resp, 100, (entries, resp) => {
  // Traitement des données collectées
  console.log('Données collectées:', entries);
});

// Ajout de données
collector.grab('key1', ['data1', 'data2']);
collector.grab('key2', ['data3']);
```

### Gestion de files d'attente avec JobQueue

```javascript
const {JobQueue} = require('xcraft-core-utils');

const runner = function* (job, next) {
  console.log(`Traitement du job ${job.id}`);
  yield setTimeout(next, 1000);
};

const queue = new JobQueue('processing', runner, 3);
queue.push({id: 1, data: 'example'});
```

### Cryptographie et hachage

```javascript
const {crypto, hash} = require('xcraft-core-utils');

// Génération de mots de passe
const password = crypto.randomPassword(16);

// Hachage d'objets
const objectHash = hash.computeHash({user: 'john', role: 'admin'});
```

### API REST

```javascript
const {RestAPI} = require('xcraft-core-utils');

const api = new RestAPI(30000);
const data = await api._get('https://api.example.com/users');
```

### Synchronisation avec locks

```javascript
const {locks} = require('xcraft-core-utils');

const mutex = new locks.Mutex();
await mutex.lock();
try {
  // Section critique
} finally {
  mutex.unlock();
}
```

### Opérations asynchrones avec mapReduce

```javascript
const {async} = require('xcraft-core-utils');

const data = ['item1', 'item2', 'item3'];
const result = yield async.mapReduce(
  item => item.id,
  item => processItem(item),
  data
);
```

## Interactions avec d'autres modules

- **[xcraft-core-log]** : Utilisé pour le logging avancé dans plusieurs utilitaires
- **[xcraft-core-fs]** : Intégré pour les opérations sur le système de fichiers
- **[xcraft-core-busclient]** : Utilisé par JobQueue pour les notifications d'événements
- **[xcraft-traverse]** : Utilisé pour la traversée d'objets complexes
- **[gigawatts]** : Support des générateurs et fonctions asynchrones

### Variables d'environnement

| Variable  | Description                                                         | Exemple                         | Valeur par défaut |
| --------- | ------------------------------------------------------------------- | ------------------------------- | ----------------- |
| `PATH`    | Chemin système utilisé par `whereIs` pour localiser les exécutables | `/usr/bin:/bin`                 | Variable système  |
| `APPDATA` | Répertoire de données d'application sur Windows                     | `C:\Users\User\AppData\Roaming` | Variable système  |

## Détails des sources

### `arrayCollector.js`

Classe pour collecter des données par clés avec un mécanisme de throttling. Permet d'accumuler des données et de les traiter par lots à intervalles réguliers. Supporte les modes synchrone et asynchrone.

#### Méthodes publiques

- **`grab(key, data)`** — Ajoute des données à la collection sous une clé spécifique et déclenche le traitement si nécessaire.
- **`cancel()`** — Annule le traitement en attente.

### `async.js`

Classe utilitaire pour les opérations asynchrones avancées qui évitent de bloquer la boucle d'événements principale.

#### Méthodes publiques

- **`mapReduce(keyFunc, valueFunc, list)`** — Réduit un tableau en map avec itération asynchrone pour éviter de bloquer la boucle d'événements sur de gros volumes de données.

### `batch.js`

Fonction utilitaire pour exécuter une action sur tous les fichiers d'un répertoire de manière récursive.

#### Méthodes publiques

- **`run(filter, location, callbackAction)`** — Parcourt récursivement un répertoire et exécute une action sur les fichiers correspondant au filtre.

### `batcher.js`

Gestionnaire de traitement par lots avec support de timeout et de seuils de déclenchement. Idéal pour optimiser les opérations de base de données ou les écritures sur disque.

#### Méthodes publiques

- **`start()`** — Démarre une nouvelle session de traitement par lots.
- **`bump()`** — Incrémente le compteur et déclenche le commit si le seuil est atteint.
- **`pump()`** — Force le commit si le timeout est atteint.
- **`stop()`** — Termine la session et exécute le commit final.
- **`dispose()`** — Marque le batcher pour destruction.

### `crypto.js`

Utilitaires cryptographiques pour le hachage, la génération de tokens et de mots de passe sécurisés.

#### Méthodes publiques

- **`md5(data)`** — Calcule le hash MD5 des données.
- **`sha256(data)`** — Calcule le hash SHA256 des données.
- **`genToken()`** — Génère un token UUID sans tirets.
- **`randomInt(min, max)`** — Génère un entier aléatoire cryptographiquement sûr dans la plage spécifiée.
- **`randomChar(chars)`** — Génère un caractère aléatoire à partir d'un ensemble de caractères.
- **`randomPassword(length=12, chars)`** — Génère un mot de passe aléatoire sécurisé.

### `cursorPump.js`

Wrapper pour les curseurs de base de données permettant de pomper les données de manière asynchrone.

#### Méthodes publiques

- **`toArray()`** — Convertit toutes les données du curseur en tableau.
- **`pump()`** — Récupère le prochain élément du curseur.

### `eventDebouncer.js`

Classe pour débouncer l'envoi d'événements, évitant les envois trop fréquents du même type d'événement.

#### Méthodes publiques

- **`publish(topic, data)`** — Publie un événement avec debouncing automatique.

### `file-crypto.js`

Utilitaires cryptographiques pour les fichiers.

#### Méthodes publiques

- **`fileChecksum(filePath, options)`** — Calcule la somme de contrôle d'un fichier avec l'algorithme spécifié.

### `files.js`

Utilitaires pour la détection de types de fichiers et l'analyse MIME avec une base de données complète d'extensions.

#### Méthodes publiques

- **`getFileFilter(filePath)`** — Retourne le filtre de fichier basé sur l'extension.
- **`getMimeType(filePath)`** — Détecte le type MIME et l'encodage d'un fichier en utilisant libmagic.

### `hash.js`

Calcul de hash SHA256 pour des objets JavaScript complexes avec traversée récursive.

#### Méthodes publiques

- **`computeHash(payload)`** — Calcule un hash déterministe d'un objet JavaScript en traversant récursivement ses propriétés.

### `jobQueue.js`

Système de files d'attente avancé avec support de priorités, limitations de parallélisme, gestion des dépendances entre groupes et mécanismes de retry.

#### Méthodes publiques

- **`push(job)`** — Ajoute un job à la file d'attente.
- **`dispose()`** — Nettoie la file d'attente et envoie les événements de fin.

### `js.js`

Utilitaires pour l'introspection de fonctions JavaScript.

#### Méthodes publiques

- **`isFunction(fn)`** — Vérifie si l'argument est une fonction.
- **`isGenerator(fn)`** — Vérifie si l'argument est une fonction générateur.
- **`isAsync(fn)`** — Vérifie si l'argument est une fonction async.

### `json.js`

Utilitaires pour la manipulation de fichiers JSON et la transformation de structures de données.

#### Méthodes publiques

- **`fromFile(jsonFile)`** — ⚠️ Déprécié : utiliser `fse.readJSONSync` à la place.
- **`toFile(json, destFile)`** — ⚠️ Déprécié : utiliser `fse.writeJSONSync` à la place.
- **`dotKeysToObject(json)`** — Convertit les clés avec points en objets imbriqués.

### `locks.js`

Implémentations de primitives de synchronisation : mutex, sémaphores et mutex récursifs avec support des générateurs.

#### Classes et méthodes

- **`Mutex`** — Mutex simple avec méthodes `lock()` et `unlock()`.
- **`RecursiveMutex`** — Mutex récursif supportant les verrous imbriqués par le même propriétaire.
- **`Semaphore`** — Sémaphore avec méthodes `wait()` et `signal()`.
- **`getMutex`** — Gestionnaire global de mutex par clé avec méthodes `lock(key)` et `unlock(key)`.

### `log.js`

Utilitaires de formatage et de décoration pour les logs avec support des couleurs, de l'indentation et de la détection de logs imbriqués.

#### Méthodes publiques

- **`decorate(mode, prefix, mod, log, maxWidth, stripBegin)`** — Formate un message de log avec couleurs et indentation intelligente.
- **`graffiti(text, callback)`** — Génère du texte ASCII art avec la police Graffiti et colorisation.
- **`getIndent()`** — Retourne l'indentation actuelle.
- **`computeIndent(prefix, mod)`** — Calcule l'indentation nécessaire pour un préfixe et module donnés.

### `mapAggregator.js`

Classe pour agréger des données dans une structure de map avec throttling.

#### Méthodes publiques

- **`put(keys, data)`** — Ajoute des données à la map en utilisant un chemin de clés.
- **`release()`** — Force la libération immédiate des données agrégées.

### `modules.js`

Utilitaires pour la gestion des modules et configurations d'applications Xcraft avec support des variantes et surcharges.

#### Méthodes publiques

- **`extractForEtc(appDir, appId, variantId)`** — Extrait la configuration pour xcraft-core-etc.
- **`loadAppConfig(appId, appDir, configJson, variantId)`** — Charge la configuration d'une application avec ses dépendances.
- **`extractAllDeps(appId, libDir, configJson)`** — Extrait toutes les dépendances d'une application récursivement.
- **`extractAllJs(libDir, modules)`** — Extrait tous les fichiers JavaScript des modules spécifiés.

### `os.js`

Utilitaires pour les opérations système multi-plateformes.

#### Méthodes publiques

- **`getAppData()`** — Retourne le répertoire de données d'application approprié selon la plateforme.

### `prop-types.js`

Générateurs de PropTypes pour les composants React avec support des types étendus Xcraft.

#### Méthodes publiques

- **`makePropTypes(props)`** — Génère un objet PropTypes à partir d'une définition de propriétés.
- **`makeDefaultProps(props)`** — Génère un objet de propriétés par défaut.

### `rankedCache.js`

Cache LRU (Least Recently Used) basé sur une liste chaînée avec émission d'événements lors de l'éviction.

#### Méthodes publiques

- **`rank(item)`** — Ajoute ou met à jour un élément dans le cache avec promotion automatique.
- **`clear()`** — Vide complètement le cache en émettant des événements 'out'.

### `reflect.js`

Utilitaires de réflexion pour l'introspection de fonctions JavaScript.

#### Méthodes publiques

- **`funcParams(func)`** — Extrait les noms des paramètres d'une fonction en gérant les valeurs par défaut et les commentaires.

### `regex.js`

Utilitaires pour la manipulation d'expressions régulières.

#### Méthodes publiques

- **`toRegexp(value)`** — Convertit une valeur en expression régulière.
- **`toAxonRegExpStr(str)`** — Convertit une chaîne avec wildcards en pattern regex pour Axon.
- **`toXcraftRegExpStr(str)`** — Convertit une chaîne avec wildcards en pattern regex pour Xcraft.

### `rest.js`

Client REST avancé avec support des streams, retry automatique, gestion d'erreurs enrichie et throttling des requêtes.

#### Méthodes publiques

- **`_get(query)`** — Effectue une requête GET et retourne le body.
- **`_getWithHeaders(query)`** — Effectue une requête GET et retourne body et headers.
- **`_post(query, payload, options)`** — Effectue une requête POST avec payload JSON.
- **`_delete(query)`** — Effectue une requête DELETE.
- **`_patch(query, payload)`** — Effectue une requête PATCH.
- **`_putForm(query, formData)`** — Effectue une requête PUT avec données de formulaire.
- **`_getStream(query, json=true)`** — Retourne un stream pour une requête GET.
- **`_postStream(query, payload, json=true)`** — Retourne un stream pour une requête POST.
- **`_streamPostStream(query, stream, json=true)`** — Envoie un stream et retourne un stream.

### `runnerInstance.js`

Singleton global pour la gestion des files d'attente de jobs avec support des priorités et dépendances.

#### Fonctionnalités

- Gestion centralisée de l'exécution des jobs
- Support des groupes de priorité
- Gestion des dépendances entre groupes
- Limitation du parallélisme par queue

### `string.js`

Utilitaires de manipulation de chaînes de caractères.

#### Méthodes publiques

- **`camelcasify(str)`** — Convertit les points en camelCase.
- **`capitalize(str)`** — Met en forme la première lettre en majuscule.
- **`jsify(str)`** — Convertit les tirets en camelCase.

### `whereIs.js`

Utilitaire pour localiser des exécutables dans le PATH système.

#### Méthodes publiques

- **`whereIs(bin)`** — Recherche un exécutable dans le PATH et retourne son chemin complet.

### `yaml.js`

Utilitaires pour la manipulation de fichiers YAML.

#### Méthodes publiques

- **`fromFile(yamlFile)`** — Charge et parse un fichier YAML.

### `zippy.js`

Utilitaire pour créer des archives ZIP avec support du chiffrement.

#### Méthodes publiques

- **`zippy(files, outputStream, options)`** — Crée une archive ZIP à partir d'une liste de fichiers vers un stream de sortie avec support optionnel du chiffrement par mot de passe.

---

_Ce document a été mis à jour pour refléter l'état actuel du code source._

[xcraft-core-log]: https://github.com/Xcraft-Inc/xcraft-core-log
[xcraft-core-fs]: https://github.com/Xcraft-Inc/xcraft-core-fs
[xcraft-core-busclient]: https://github.com/Xcraft-Inc/xcraft-core-busclient
[xcraft-traverse]: https://github.com/Xcraft-Inc/xcraft-traverse
[gigawatts]: https://github.com/Xcraft-Inc/gigawatts