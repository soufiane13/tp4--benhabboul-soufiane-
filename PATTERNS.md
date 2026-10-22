# PATTERNS TP 4 
**Binôme :** Soufiane Benhabboul  
**Parcours :** Dev

## Tableau des patterns

| Pattern | Problème résolu dans ShopLite | Alternative écartée | Pourquoi écartée |
| :--- | :--- | :--- | :--- |
| **Factory Method + Registre** | Permet d'ajouter de nouveaux canaux de notification (ex: Slack) sans toucher au fichier `channels.js` (Principe Ouvert/Fermé). | Un grand `switch/case` dans une classe unique pour instancier les canaux. | Obligerait à modifier le code central à chaque nouveau canal (violation de l'OCP). |
| **Builder** | Construire un message avec plusieurs variables (`to`, `template`, `with`) de façon fluide, en validant toutes les règles d'un coup à la fin (`build()`). | Un constructeur géant avec 6 ou 7 arguments (Télescopage). | Illisible, facile de se tromper dans l'ordre des paramètres, et difficile de valider le remplacement de variables. |
| **Adapter** | Unifier les méthodes et données incompatibles de DHL et Colissimo derrière un contrat commun : `getQuote({weightKg, zip})`. | Appeler directement les méthodes `tarif()` et `getRate()` dans la logique métier de ShopLite. | Fort couplage technique, rendant la comparaison complexe et le code impossible à tester facilement. |
| **Decorator** | Ajouter un mécanisme de *retry* et de *cache* aux transporteurs de manière dynamique, sans modifier le code de leurs API ni des adaptateurs. | Coder le cache et les boucles de `try/catch` directement à l'intérieur de `DhlAdapter`. | Mélange les responsabilités (SRP) et empêche de réutiliser le système de cache pour Colissimo. |
| **Facade** | Fournir un point d'entrée unique (`ShippingService`) au reste de l'application pour interroger tous les transporteurs en parallèle et récupérer le meilleur. | Laisser `main.js` ou l'interface utilisateur gérer le `Promise.allSettled`, le filtrage des erreurs et le tri des prix. | Fuite de la complexité métier dans l'interface, code non réutilisable ailleurs dans l'application. |

## Question sur l'ordre des Décorateurs
*Pourquoi le cache doit-il envelopper le retry, et pas l'inverse ?*
Parce que l'on souhaite mettre en cache **un appel réussi**. Si on inversait l'ordre (`Retry(Cache)`), en cas d'erreur de l'API, le cache pourrait mémoriser l'erreur (si mal conçu) et la relancer à chaque fois. En mettant `Cache(Retry)`, le cache vérifie d'abord s'il a le résultat final ; s'il ne l'a pas, il délègue au Retry qui fait tout son possible pour obtenir un résultat valide à mettre en cache.