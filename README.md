# Fika

Fika is Team NextGen's grocery loyalty prototype. Shoppers can complete weekly challenges, open reward boxes, trade digital collectibles, and combine items to unlock discounts.

## What is included

| Folder | Component |
| --- | --- |
| `x5-loyalty-system/` | Fika web app, local demo API, and recommendation engine |
| `fika-android/` | Offline Android app source |
| `fika-mobile/` | Expo Go preview for iPhone |
| `scripts/` | Android demo fixture generators |

The demo uses synthetic shopper and reward data. Discounted surplus-food sales and paid subscriptions are roadmap features.

## Run the web demo

Install Bun 1.4 and make Python 3 available as `python3` on your PATH. From the repository root, run:

```sh
cd x5-loyalty-system
bun install --frozen-lockfile
bun run dev --host 0.0.0.0 --port 5188
```

Open `http://localhost:5188` on your computer.

## Preview on iPhone

Run the web demo first. Connect your phone and computer to the same network, then set `EXPO_PUBLIC_FIKA_URL` in `fika-mobile/.env.local` to `http://YOUR_COMPUTER_LAN_IP:5188/`.

```sh
cd fika-mobile
bun install --frozen-lockfile
bun run start
```

Scan the Metro QR code with a device running a compatible version of Expo Go.

## Build the Android demo

Install JDK 21, Gradle 8.9, Android SDK Platform 35 and Build Tools 35.0.0, and Python 3.12. Point `ANDROID_HOME` at the Android SDK. Set `FIKA_BUILD_PYTHON` to your Python 3.12 executable if Gradle cannot find it automatically.

```sh
cd x5-loyalty-system
bun install --frozen-lockfile
bun run build
cd ..
python3 fika-android/prepare-runtime.py
python3 fika-android/test_runtime.py
gradle -p fika-android :app:assembleDebug
```

The debug APK is written to `fika-android/app/build/outputs/apk/debug/app-debug.apk`. On Windows, use `python` in place of `python3` for the two build commands if needed.

## License

See [LICENSE](LICENSE), [NOTICE](NOTICE), and the [mobile license](fika-mobile/LICENSE).
