# 🐮 Cowboy
**Cowboy** is a responsive multiplayer game for everyone to play, that I developed for fun. On Cowboy you can play one of two roles ([see details](#Instructions))
  where both sides have a [*semi-fair*](#Fairness) chance to win! <br/> <br/>
  
  The whole development of the game (Frontend & Backend & DevOps) highly strengthed my experience on those subjects and I am glad that I actually managed to finish this project. <br/>

  💎 *A tip on finishing visual projects: start with the logic (backend) and a basic ui and start working on the design only you get the base down working* 

## 🔨 Development
This multiplayer game is based on the communication between the players, and this is done using [**Websockets**](https://en.wikipedia.org/wiki/WebSocket). <br/>
The clients are using the browser's native [`WebSocket API`](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) and the server is using the famous [`Websockets Library`](https://websockets.readthedocs.io/en/stable/) in Python.

### Frontend
The frontend was developed with [`🔰 Vue`](https://vuejs.org/) & [`💙 Vuetify`](https://vuetifyjs.com/en/). A little bit of [`🍎 JQuery`](https://jquery.com/) is used too.

### Backend
The website's server runs on a ([DigitalOcean](https://www.digitalocean.com/)) `🍖 Ubuntu` Droplet.
The websocket server also runs on the same machine and powered by <img align="center" href="https://www.python.org" src="https://cdn3.iconfinder.com/data/icons/logos-and-brands-adobe/512/267_Python-512.png" width=18> Python 3.9 using the websockets library.

### Domain
A `your-website-subdomain.web.app` domain is freely available by [`🔥 Firebase Hosting`](https://firebase.google.com/docs/hosting) (Static sites only), Github Pages is a great option too.

#### Custom Domain
I also managed to set up the game on a custom domain and this was done by setting it on digialocean's dns resolvers and configuring the web server via [`🥗 Nginx`](https://www.nginx.com/) ([see details including SSL setup](ubuntu-setup.md)).

## 🗺️ Instructions
When you play you can choose your role - 🐮 Cows or 🐶 Dogs.
This allows a fun diversity and game style change.

### 🐮 Cows
The goal of the cows side is to go over the river (on the other side). <br/>
The game starts with 11 cows on the first row and on each turn the player can move a cow one step forward. <br/>
Be aware that cows can be eaten by the King (diagonally) and blocked by the Dogs. <br/>
As the cows, you have the advantage of the crowd - try to confuse the King and the Dogs with this. <br/>

### 🐶 Dogs (& 👑 King)
The goal of the dogs side is to take all the cows down before one of them goes over the river. <br/>
The game starts with a King in the middle of the first row and 4 dogs surrounding it (2 to the right & left) <br/>
The Dogs can move like a [Chess Rook](https://i.imgur.com/soZUYyN.png) (any amount forward or to the sides) and they can block the Cows from going forward. <br/>
The King is everything, it eats the cows, but it can only do it diagonally. It moves like a [Chess King](https://i.imgur.com/PIUVJFp.png) (one to any of the 8 sides surrounding it) <br/>
Be aware that you are unlikely to take down a cow with the king alone = use your Dogs to stop them from going forward and only then attack. <br/>

## 🎉 Showcase

#### Home Page
<img src="https://i.imgur.com/Gc5YNgF.png" height=450>

#### Private Game
<img src="https://i.imgur.com/MRKCzPQ.png" width=200>

#### Enter Private Game
<img src="https://i.imgur.com/uiXk8Cj.png" width=200>

#### Global Queue
<img src="https://i.imgur.com/UD2aGyQ.png" width=200>

#### How to Play
<img src="https://i.imgur.com/75dCHIp.png" width=200>

#### Game (screen is landscape)
<img src="https://i.imgur.com/7PKZWqd.png" width=450>

## 🏗️ TODO
The game is fully functional but new improvments could always be added!

- [ ] ⌚ Turn timer (currently there is no turn-timer and games can last forever :P)
- [ ] 🤖 Playing against bots (with difficulties - easy, fair or impossible)
- [ ] 🌈 Game themes (changes the board colors, pieces and sounds)

## 🔮 Cheating
I tried to make the game cheating-proofed but I ***would love*** to see someone find a way to win the game in a special win!

## 😿 Fairness
For some reason I find it hard to believe that this game is fair (it seems that winning with the cows is easier), though it was
never proofed! Feel free to try to convince me which side has a better chance of winning.

## 👥 Contributing
If you want to contribute to the project and make it better, your help is very welcome ([see guide](CONTRIBUTING.md)). <br/>
If you don't feel like conding, feel free to post suggestions / bugs in the [Pull Requests](https://github.com/VerifyBot/cowboy/pulls) section!
