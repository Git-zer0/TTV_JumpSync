

# 🚀 TwitchJumpSync 
Jump to precise moments in VODs and save your favorite highlights with the MARK function to watch them again later.

### 📸 Aperçu de l'application

| | | |
| :---: | :---: | :---: |
| ![Capture 1](1.jpg) | ![Capture 2](2.jpg) | ![Capture 3](3.jpg) |
| ![Capture 4](4.jpg) | ![Capture 5](5.jpg) | ![Capture 6](6.jpg) |



                                                                 - Quick Start Guide -


# 🚀 Twitch Jump Sync

## 🧩 Install
- Install Tampermonkey (Chrome / Firefox)
- Go to : https://github.com/Git-zer0/TTV_JumpSync/
- Click TwitchJumpSync.user.js
- Click RAW → Install ✅

## 🎮 Usage
- Open Twitch → app appears automatically

Required only if you want to sync your bookmarks across your devices (Ideal when you are watching on your tablet in bed and want to watch it again the next day on PC): 
Tutorial by  Guide Hub : https://www.youtube.com/watch?v=4i9M4spECJQ
## 🔄 Firebase sync
- Create Firebase DB (URL + API + ID)
- ⚙️ PC : enter data in app
- 📱 Mobile (Firefox Nightly) : paste same data

## 🔐 Firebase rules
```json
{
  "rules": {
    "tw_sync_data": {
      "ma_synchro_privee": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}






# 🚀 Twitch Jump Sync

## 🧩 Installation
- Installe Tampermonkey (Chrome / Firefox)
- Va sur : https://github.com/Git-zer0/TTV_JumpSync/
- Clique TwitchJumpSync.user.js
- Clique RAW → Install ✅

## 🎮 Utilisation
- Ouvre Twitch → l’app apparaît automatiquement

Obligatoirement seulement si vous voulez synchroniser vos marqueurs entre vos appareils (Idéal quand vous regardez la tablette dans le lit et que vous voulez revoir le lendemain sur PC):
Tutoriel de  Guide Hub : https://www.youtube.com/watch?v=4i9M4spECJQ
## 🔄 Firebase sync
- Crée une DB Firebase (URL + API + ID)
- ⚙️ PC : renseigne les infos dans l’app
- 📱 Mobile (Firefox Nightly) : colle les mêmes infos

## 🔐 Rules Firebase
```json
{
  "rules": {
    "tw_sync_data": {
      "ma_synchro_privee": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
