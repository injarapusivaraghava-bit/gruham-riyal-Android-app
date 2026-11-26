import os
import shutil
import zipfile
import subprocess
import struct
import zlib
import math

# ==============================================================================
# 1. PURE-PYTHON ANTI-ALIASED OFFICIAL MANA GRUHAM HOUSE LOGO GENERATOR
# ==============================================================================
# Generates crisp, zero-dependency RGBA PNG icons at 2x supersampling
# matching src/components/ManaGruhamLogo.tsx and public/icon.svg identically.

def _clamp(v, lo=0.0, hi=1.0):
    return lo if v < lo else (hi if v > hi else v)

def _lerp(a, b, t):
    return a + (b - a) * t

def _lerp_color(c1, c2, t):
    t = _clamp(t)
    return (
        int(round(_lerp(c1[0], c2[0], t))),
        int(round(_lerp(c1[1], c2[1], t))),
        int(round(_lerp(c1[2], c2[2], t))),
        int(round(_lerp(c1[3], c2[3], t))),
    )

def _point_in_poly(x, y, poly):
    inside = False
    n = len(poly)
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) if (yj != yi) else 1e-9) + xi):
            inside = not inside
        j = i
    return inside

def _dist_seg(px, py, x1, y1, x2, y2):
    dx = x2 - x1
    dy = y2 - y1
    l2 = dx * dx + dy * dy
    if l2 == 0:
        return math.hypot(px - x1, py - y1)
    t = _clamp(((px - x1) * dx + (py - y1) * dy) / l2)
    proj_x = x1 + t * dx
    proj_y = y1 + t * dy
    return math.hypot(px - proj_x, py - proj_y)

def _in_round_rect(x, y, x0, y0, x1, y1, r):
    if x < x0 or x > x1 or y < y0 or y > y1:
        return False
    cx0, cx1 = x0 + r, x1 - r
    cy0, cy1 = y0 + r, y1 - r
    if x < cx0 and y < cy0:
        return (x - cx0) ** 2 + (y - cy0) ** 2 <= r * r
    if x > cx1 and y < cy0:
        return (x - cx1) ** 2 + (y - cy0) ** 2 <= r * r
    if x < cx0 and y > cy1:
        return (x - cx0) ** 2 + (y - cy1) ** 2 <= r * r
    if x > cx1 and y > cy1:
        return (x - cx1) ** 2 + (y - cy1) ** 2 <= r * r
    return True

def _blend_over(dst, src):
    sa = src[3] / 255.0
    if sa <= 0.0:
        return dst
    if sa >= 1.0:
        return src
    da = dst[3] / 255.0
    out_a = sa + da * (1.0 - sa)
    if out_a <= 0.0:
        return (0, 0, 0, 0)
    r = int(round((src[0] * sa + dst[0] * da * (1.0 - sa)) / out_a))
    g = int(round((src[1] * sa + dst[1] * da * (1.0 - sa)) / out_a))
    b = int(round((src[2] * sa + dst[2] * da * (1.0 - sa)) / out_a))
    return (_clamp(r, 0, 255), _clamp(g, 0, 255), _clamp(b, 0, 255), int(round(out_a * 255.0)))

def _render_logo_rgba(size, full_bleed_bg=False, icon_scale=1.0):
    """
    Render the official Mana Gruham Green & White House Logo at `size x size`
    using 2x supersampling for clean anti-aliased edges.
    """
    ss = size * 2
    # Colors
    C_EMERALD_DARK = (6, 95, 70, 255)      # #065F46
    C_EMERALD_MID  = (21, 128, 61, 255)    # #15803D
    C_EMERALD_LT   = (16, 185, 129, 255)   # #10B981
    C_WHITE        = (255, 255, 255, 255)  # #FFFFFF
    C_MINT_50      = (236, 253, 245, 255)  # #ECFDF5
    C_MINT_100     = (209, 250, 229, 255)  # #D1FAE5
    C_MINT_200     = (167, 243, 208, 255)  # #A7F3D0
    C_GOLD_KNOB    = (253, 230, 138, 255)  # #FDE68A

    roof_poly = [(96, 244), (256, 106), (416, 244), (390, 272), (256, 156), (122, 272)]
    body_poly = [(142, 254), (256, 158), (370, 254), (370, 390), (142, 390)]

    # Render supersampled buffer
    buf = bytearray(ss * ss * 4)
    inv_ss = 512.0 / ss
    center = 256.0
    inv_scale = 1.0 / icon_scale

    for py in range(ss):
        sy = (py + 0.5) * inv_ss
        # Transform around center if scaled (e.g. maskable/adaptive foreground)
        vy = (sy - center) * inv_scale + center
        row_off = py * ss * 4
        for px in range(ss):
            sx = (px + 0.5) * inv_ss
            vx = (sx - center) * inv_scale + center

            col = (0, 0, 0, 0)

            # Background fill for maskable full bleed
            if full_bleed_bg:
                gt = (sx + sy) / 1024.0
                if gt < 0.55:
                    col = _lerp_color(C_EMERALD_DARK, C_EMERALD_MID, gt / 0.55)
                else:
                    col = _lerp_color(C_EMERALD_MID, C_EMERALD_LT, (gt - 0.55) / 0.45)

            # Rounded Green Container Badge (only when not full_bleed_bg, or inner card)
            if not full_bleed_bg and _in_round_rect(vx, vy, 24, 24, 488, 488, 108):
                gt = ((vx - 24) + (vy - 24)) / 928.0
                if gt < 0.55:
                    col = _lerp_color(C_EMERALD_DARK, C_EMERALD_MID, gt / 0.55)
                else:
                    col = _lerp_color(C_EMERALD_MID, C_EMERALD_LT, (gt - 0.55) / 0.45)

                # Subtle inner border
                in_outer_stroke = _in_round_rect(vx, vy, 35.5, 35.5, 476.5, 476.5, 98.5)
                in_inner_stroke = _in_round_rect(vx, vy, 40.5, 40.5, 471.5, 471.5, 93.5)
                if in_outer_stroke and not in_inner_stroke:
                    col = _blend_over(col, (255, 255, 255, 62))

            # Subtle Halo behind house roof
            if (vx - 256) ** 2 + (vy - 216) ** 2 <= 132 ** 2:
                if col[3] > 0:
                    col = _blend_over(col, (255, 255, 255, 22))

            # Chimney
            if _in_round_rect(vx, vy, 336, 138, 368, 204, 8):
                col = _blend_over(col, C_MINT_100)

            # House Main Body (with bottom corners rounded r=22)
            in_body = False
            if 142 <= vx <= 370 and 158 <= vy <= 390:
                if _point_in_poly(vx, vy, body_poly):
                    in_body = True
                    # Trim bottom left/right rounded corners (r=22)
                    if vx < 164 and vy > 368:
                        in_body = (vx - 164) ** 2 + (vy - 368) ** 2 <= 22 ** 2
                    elif vx > 348 and vy > 368:
                        in_body = (vx - 348) ** 2 + (vy - 368) ** 2 <= 22 ** 2
            if in_body:
                col = _blend_over(col, C_WHITE)

            # Four-Pane Window (Left)
            if _in_round_rect(vx, vy, 172, 274, 228, 330, 10):
                col = _blend_over(col, C_EMERALD_MID)
                if _in_round_rect(vx, vy, 179, 281, 197, 299, 3) or _in_round_rect(vx, vy, 203, 281, 221, 299, 3):
                    col = _blend_over(col, C_MINT_200)
                elif _in_round_rect(vx, vy, 179, 305, 197, 323, 3) or _in_round_rect(vx, vy, 203, 305, 221, 323, 3):
                    col = _blend_over(col, C_MINT_50)

            # Arched Doorway (Right)
            in_door = False
            if 254 <= vx <= 316 and 264 <= vy <= 390:
                if vy >= 295:
                    in_door = True
                else:
                    in_door = (vx - 285) ** 2 + (vy - 295) ** 2 <= 31 ** 2
            if in_door:
                col = _blend_over(col, C_EMERALD_DARK)
                if (vx - 303) ** 2 + (vy - 336) ** 2 <= 5.5 ** 2:
                    col = _blend_over(col, C_GOLD_KNOB)

            # Pitched Roof (overlaps top cleanly)
            if 96 <= vx <= 416 and 106 <= vy <= 272 and _point_in_poly(vx, vy, roof_poly):
                rt = (vy - 106) / 166.0
                col = _blend_over(col, _lerp_color(C_WHITE, C_MINT_50, rt))

            # Green Land Horizon Arc Under House
            if 108 <= vx <= 404 and 372 <= vy <= 406:
                u = (vx - 256) / 148.0
                top_y = 378 + 14 * (u * u)
                bot_y = 403 - 11 * (u * u)
                if top_y <= vy <= bot_y:
                    col = _blend_over(col, C_MINT_100)

            # 100% Verified Shield Badge (Bottom Right at 372, 364)
            d_badge = (vx - 372) ** 2 + (vy - 364) ** 2
            if d_badge <= 46 ** 2:
                col = _blend_over(col, C_EMERALD_DARK)
                if d_badge <= 41 ** 2:
                    col = _blend_over(col, C_WHITE)
                if d_badge <= 36 ** 2:
                    col = _blend_over(col, C_EMERALD_LT)
                # White checkmark
                d1 = _dist_seg(vx, vy, 353, 365, 366, 378)
                d2 = _dist_seg(vx, vy, 366, 378, 392, 350)
                if min(d1, d2) <= 4.7:
                    col = _blend_over(col, C_WHITE)

            idx = row_off + px * 4
            buf[idx] = col[0]
            buf[idx + 1] = col[1]
            buf[idx + 2] = col[2]
            buf[idx + 3] = col[3]

    # Downsample 2x2 to target size
    out = bytearray(size * size * 4)
    for y in range(size):
        sy0 = y * 2
        sy1 = sy0 + 1
        for x in range(size):
            sx0 = x * 2
            sx1 = sx0 + 1
            p00 = (sy0 * ss + sx0) * 4
            p01 = (sy0 * ss + sx1) * 4
            p10 = (sy1 * ss + sx0) * 4
            p11 = (sy1 * ss + sx1) * 4
            a_sum = buf[p00 + 3] + buf[p01 + 3] + buf[p10 + 3] + buf[p11 + 3]
            oi = (y * size + x) * 4
            if a_sum == 0:
                out[oi:oi+4] = b"\x00\x00\x00\x00"
            else:
                r = (buf[p00] * buf[p00+3] + buf[p01] * buf[p01+3] + buf[p10] * buf[p10+3] + buf[p11] * buf[p11+3]) // a_sum
                g = (buf[p00+1] * buf[p00+3] + buf[p01+1] * buf[p01+3] + buf[p10+1] * buf[p10+3] + buf[p11+1] * buf[p11+3]) // a_sum
                b = (buf[p00+2] * buf[p00+3] + buf[p01+2] * buf[p01+3] + buf[p10+2] * buf[p10+3] + buf[p11+2] * buf[p11+3]) // a_sum
                a = a_sum // 4
                out[oi] = r
                out[oi+1] = g
                out[oi+2] = b
                out[oi+3] = a
    return bytes(out)

def _write_png(filepath, width, height, rgba_bytes):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    raw_rows = bytearray()
    stride = width * 4
    for y in range(height):
        raw_rows.append(0)  # Filter type 0 (None)
        raw_rows.extend(rgba_bytes[y * stride : (y + 1) * stride])

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_rows), 9)
    png_data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "wb") as f:
        f.write(png_data)

def _flatten_on_white(rgba_bytes):
    out = bytearray(len(rgba_bytes))
    for i in range(0, len(rgba_bytes), 4):
        a = rgba_bytes[i + 3] / 255.0
        out[i] = int(round(rgba_bytes[i] * a + 255 * (1.0 - a)))
        out[i + 1] = int(round(rgba_bytes[i + 1] * a + 255 * (1.0 - a)))
        out[i + 2] = int(round(rgba_bytes[i + 2] * a + 255 * (1.0 - a)))
        out[i + 3] = 255
    return bytes(out)

def generate_all_logo_assets(android_base_dir):
    print("Generating official Mana Gruham Green & White house logo PNG/ICO assets...")
    # 1. Web / PWA icons in public/ and unified logo asset in src/assets/
    os.makedirs("public", exist_ok=True)
    os.makedirs("src/assets", exist_ok=True)
    master_512 = _render_logo_rgba(512, full_bleed_bg=False, icon_scale=1.0)
    _write_png("src/assets/mana_gruham_logo.png", 512, 512, master_512)
    _write_png("public/mana-gruham-logo.png", 512, 512, master_512)
    _write_png("public/pwa-512x512.png", 512, 512, master_512)

    icon_192 = _render_logo_rgba(192, full_bleed_bg=False, icon_scale=1.0)
    _write_png("public/pwa-192x192.png", 192, 192, icon_192)
    _write_png("public/icon.png", 192, 192, icon_192)

    # Maskable icon (68% safe-zone centered inside full-bleed emerald gradient)
    maskable_512 = _render_logo_rgba(512, full_bleed_bg=True, icon_scale=0.68)
    _write_png("public/pwa-maskable-512x512.png", 512, 512, maskable_512)

    # Apple touch icon (180x180 opaque)
    apple_180 = _flatten_on_white(_render_logo_rgba(180, full_bleed_bg=False, icon_scale=1.0))
    _write_png("public/apple-touch-icon.png", 180, 180, apple_180)

    # Favicon.ico via ImageMagick from generated PNG
    subprocess.run(
        ["convert", "public/pwa-512x512.png", "-define", "icon:auto-resize=64,48,32,16", "public/favicon.ico"],
        check=False
    )

    # 2. Android Splash & Adaptive Icon Drawables
    res_dir = os.path.join(android_base_dir, "app/src/main/res")
    _write_png(os.path.join(res_dir, "drawable/splash_logo.png"), 512, 512, master_512)

    # Adaptive icon foreground (432x432 with 68% safe-zone over pure white adaptive background so the rounded green logo never clips or blends)
    fg_432 = _render_logo_rgba(432, full_bleed_bg=False, icon_scale=0.68)
    _write_png(os.path.join(res_dir, "drawable/ic_launcher_foreground.png"), 432, 432, fg_432)

    # Mipmap launcher icons for all densities
    densities = {
        "mipmap-mdpi": 48,
        "mipmap-hdpi": 72,
        "mipmap-xhdpi": 96,
        "mipmap-xxhdpi": 144,
        "mipmap-xxxhdpi": 192,
    }
    for folder, px in densities.items():
        rgba = _render_logo_rgba(px, full_bleed_bg=False, icon_scale=1.0)
        _write_png(os.path.join(res_dir, folder, "ic_launcher.png"), px, px, rgba)
        _write_png(os.path.join(res_dir, folder, "ic_launcher_round.png"), px, px, rgba)

    print("Official house logo assets generated for Web, PWA, and Android APKs.")


# ==============================================================================
# 2. ANDROID STUDIO & GITHUB ACTIONS BUILD PROJECT GENERATOR
# ==============================================================================

def build_web_assets():
    print("Building web assets using 'npm run build'...")
    try:
        result = subprocess.run(["npm", "run", "build"], capture_output=True, text=True)
        if result.returncode != 0:
            print("Web build failed:")
            print(result.stderr)
            return False
        print("Web build completed successfully.")
        return True
    except Exception as e:
        print(f"Error during web build: {e}")
        return False

def setup_android_structure():
    base_dir = "android-project"
    if os.path.exists(base_dir):
        shutil.rmtree(base_dir)
    os.makedirs(base_dir)
    print("Created android-project directory structure...")

    dirs = [
        ".github/workflows",
        "gradle/wrapper",
        "app/src/main/java/com/managruham/realapp",
        "app/src/main/res/drawable",
        "app/src/main/res/mipmap-anydpi-v26",
        "app/src/main/res/mipmap-mdpi",
        "app/src/main/res/mipmap-hdpi",
        "app/src/main/res/mipmap-xhdpi",
        "app/src/main/res/mipmap-xxhdpi",
        "app/src/main/res/mipmap-xxxhdpi",
        "app/src/main/res/values",
        "app/src/main/res/values-v31",
        "app/src/main/res/xml",
        "app/src/main/assets",
    ]
    for d in dirs:
        os.makedirs(os.path.join(base_dir, d), exist_ok=True)
    return base_dir

def write_gradle_wrapper_properties(base_dir):
    content = """distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
"""
    with open(os.path.join(base_dir, "gradle/wrapper/gradle-wrapper.properties"), "w", encoding="utf-8") as f:
        f.write(content)

def write_settings_gradle_kts(base_dir):
    content = """pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ManaGruham_RealApp"
include(":app")
"""
    with open(os.path.join(base_dir, "settings.gradle.kts"), "w", encoding="utf-8") as f:
        f.write(content)

def write_settings_gradle_groovy(base_dir):
    content = """// Groovy version of settings.gradle for backward-compatibility
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "ManaGruham_RealApp"
include ':app'
"""
    with open(os.path.join(base_dir, "settings.gradle"), "w", encoding="utf-8") as f:
        f.write(content)

def write_local_properties(base_dir):
    content = """# Local properties generated for Android Studio compilation
# Update sdk.dir to your local Android SDK location if needed.
# macOS: sdk.dir=/Users/<username>/Library/Android/sdk
# Windows: sdk.dir=C\\:\\\\Users\\\\<username>\\\\AppData\\\\Local\\\\Android\\\\Sdk
# Linux: sdk.dir=/home/<username>/Android/Sdk
"""
    with open(os.path.join(base_dir, "local.properties"), "w", encoding="utf-8") as f:
        f.write(content)

def write_project_build_gradle_kts(base_dir):
    content = """// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    id("com.android.application") version "8.2.2" apply false
    id("org.jetbrains.kotlin.android") version "1.9.22" apply false
}
"""
    with open(os.path.join(base_dir, "build.gradle.kts"), "w", encoding="utf-8") as f:
        f.write(content)

def write_gradle_properties(base_dir):
    content = """org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
android.enableJetifier=true
kotlin.code.style=official
"""
    with open(os.path.join(base_dir, "gradle.properties"), "w", encoding="utf-8") as f:
        f.write(content)

def write_app_build_gradle_kts(base_dir):
    content = """plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.managruham.realapp"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.managruham.realapp"
        minSdk = 24
        targetSdk = 34
        versionCode = 2
        versionName = "2.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("debug")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        viewBinding = true
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.webkit:webkit:1.9.0")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}
"""
    with open(os.path.join(base_dir, "app/build.gradle.kts"), "w", encoding="utf-8") as f:
        f.write(content)

def write_proguard_rules(base_dir):
    content = """# ProGuard rules for Mana Gruham Real App
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
"""
    with open(os.path.join(base_dir, "app/proguard-rules.pro"), "w", encoding="utf-8") as f:
        f.write(content)

def write_android_manifest(base_dir):
    content = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.managruham.realapp">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.ManaGruhamRealApp"
        android:networkSecurityConfig="@xml/network_security_config"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:theme="@style/Theme.ManaGruhamRealApp">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
"""
    with open(os.path.join(base_dir, "app/src/main/AndroidManifest.xml"), "w", encoding="utf-8") as f:
        f.write(content)

def write_network_security_config(base_dir):
    content = """<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
"""
    with open(os.path.join(base_dir, "app/src/main/res/xml/network_security_config.xml"), "w", encoding="utf-8") as f:
        f.write(content)

def write_colors_xml(base_dir):
    content = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="black">#FF000000</color>
    <color name="white">#FFFFFFFF</color>
    <color name="emerald_900">#FF065F46</color>
    <color name="emerald_700">#FF15803D</color>
    <color name="emerald_500">#FF10B981</color>
    <color name="emerald_100">#FFD1FAE5</color>
    <color name="emerald_50">#FFECFDF5</color>
</resources>
"""
    with open(os.path.join(base_dir, "app/src/main/res/values/colors.xml"), "w", encoding="utf-8") as f:
        f.write(content)

def write_strings_xml(base_dir):
    content = """<resources>
    <string name="app_name">Mana Gruham</string>
    <string name="app_subtitle_te">మన గృహం రియల్ యాప్</string>
    <string name="verified_tagline">100% Verified Listings</string>
</resources>
"""
    with open(os.path.join(base_dir, "app/src/main/res/values/strings.xml"), "w", encoding="utf-8") as f:
        f.write(content)

def write_drawables_and_themes(base_dir):
    # Adaptive icon background (crisp pure white so the official emerald house logo stands out sharply in all Android masks)
    ic_bg_xml = """<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
</shape>
"""
    with open(os.path.join(base_dir, "app/src/main/res/drawable/ic_launcher_background.xml"), "w", encoding="utf-8") as f:
        f.write(ic_bg_xml)

    # Adaptive icon XMLs
    adaptive_xml = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
"""
    for fn in ("ic_launcher.xml", "ic_launcher_round.xml"):
        with open(os.path.join(base_dir, "app/src/main/res/mipmap-anydpi-v26", fn), "w", encoding="utf-8") as f:
            f.write(adaptive_xml)

    # Window background splash drawable (Pure White + Centered 156dp Official House Logo - NEVER clipped or blank)
    splash_bg_xml = """<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/white" />
    <item
        android:width="156dp"
        android:height="156dp"
        android:gravity="center"
        android:drawable="@drawable/splash_logo" />
</layer-list>
"""
    with open(os.path.join(base_dir, "app/src/main/res/drawable/splash_background.xml"), "w", encoding="utf-8") as f:
        f.write(splash_bg_xml)

    # Android 12+ Splash Icon Inset (20% safe inset inside system circle so official logo is NEVER cut off)
    splash_inset_xml = """<?xml version="1.0" encoding="utf-8"?>
<inset xmlns:android="http://schemas.android.com/apk/res/android"
    android:drawable="@drawable/splash_logo"
    android:insetLeft="20%"
    android:insetTop="20%"
    android:insetRight="20%"
    android:insetBottom="20%" />
"""
    with open(os.path.join(base_dir, "app/src/main/res/drawable/splash_icon_inset.xml"), "w", encoding="utf-8") as f:
        f.write(splash_inset_xml)

    # Tagline rounded pill drawable for native splash overlay
    pill_xml = """<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <gradient
        android:angle="0"
        android:startColor="#ECFDF5"
        android:centerColor="#FEF3C7"
        android:endColor="#EFF6FF"
        android:type="linear" />
    <stroke android:width="1.5dp" android:color="#10B981" />
    <corners android:radius="999dp" />
</shape>
"""
    with open(os.path.join(base_dir, "app/src/main/res/drawable/verified_pill_bg.xml"), "w", encoding="utf-8") as f:
        f.write(pill_xml)

    # Card frame behind splash logo
    logo_card_xml = """<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
    <solid android:color="#FFFFFF" />
    <stroke android:width="2dp" android:color="#10B981" />
    <corners android:radius="32dp" />
</shape>
"""
    with open(os.path.join(base_dir, "app/src/main/res/drawable/splash_logo_card.xml"), "w", encoding="utf-8") as f:
        f.write(logo_card_xml)

    # Base Theme (API 24+)
    themes_xml = """<resources xmlns:tools="http://schemas.android.com/tools">
    <style name="Theme.ManaGruhamRealApp" parent="Theme.MaterialComponents.Light.NoActionBar">
        <item name="colorPrimary">@color/emerald_700</item>
        <item name="colorPrimaryVariant">@color/emerald_900</item>
        <item name="colorOnPrimary">@color/white</item>
        <item name="android:statusBarColor">@color/emerald_700</item>
        <item name="android:navigationBarColor">@color/white</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowBackground">@drawable/splash_background</item>
    </style>
</resources>
"""
    with open(os.path.join(base_dir, "app/src/main/res/values/themes.xml"), "w", encoding="utf-8") as f:
        f.write(themes_xml)

    # Android 12+ Theme (API 31+ prevents cropped splash icons on Vivo Funtouch OS 12/13/14/15)
    themes_v31_xml = """<resources>
    <style name="Theme.ManaGruhamRealApp" parent="Theme.MaterialComponents.Light.NoActionBar">
        <item name="colorPrimary">@color/emerald_700</item>
        <item name="colorPrimaryVariant">@color/emerald_900</item>
        <item name="colorOnPrimary">@color/white</item>
        <item name="android:statusBarColor">@color/emerald_700</item>
        <item name="android:navigationBarColor">@color/white</item>
        <item name="android:windowLightStatusBar">false</item>
        <item name="android:windowBackground">@drawable/splash_background</item>
        <item name="android:windowSplashScreenBackground">@color/white</item>
        <item name="android:windowSplashScreenAnimatedIcon">@drawable/splash_icon_inset</item>
    </style>
</resources>
"""
    with open(os.path.join(base_dir, "app/src/main/res/values-v31/themes.xml"), "w", encoding="utf-8") as f:
        f.write(themes_v31_xml)

def write_main_activity_kt(base_dir):
    content = """package com.managruham.realapp

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.PorterDuff
import android.graphics.Shader
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.animation.OvershootInterpolator
import android.webkit.*
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.RelativeLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar
    private lateinit var splashOverlay: RelativeLayout
    private lateinit var nativeHeaderBar: LinearLayout
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private val FILE_CHOOSER_RESULT_CODE = 1001

    private val liveUrl = "https://ais-pre-h6q6uvhlkysrts2zjytsqs-130060079220.asia-southeast1.run.app/?nativeSplash=1&nativeHeader=1"
    private val fallbackLocalUrl = "file:///android_asset/index.html?nativeSplash=1&nativeHeader=1"

    private val mainHandler = Handler(Looper.getMainLooper())
    private var launchTimeMs: Long = 0L
    private var pageFinished = false
    private var splashDismissed = false
    private var fallbackTriggered = false
    private val minSplashDurationMs = 2200L

    private fun dp(value: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value.toFloat(),
            resources.displayMetrics
        ).toInt()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        launchTimeMs = SystemClock.elapsedRealtime()

        // Ensure content never hides behind the Android status bar or display cutout
        WindowCompat.setDecorFitsSystemWindows(window, true)

        val rootLayout = RelativeLayout(this).apply {
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.WHITE)
        }

        ViewCompat.setOnApplyWindowInsetsListener(rootLayout) { view, windowInsets ->
            val insets = windowInsets.getInsets(
                WindowInsetsCompat.Type.statusBars() or
                    WindowInsetsCompat.Type.displayCutout() or
                    WindowInsetsCompat.Type.navigationBars()
            )
            view.setPadding(insets.left, insets.top, insets.right, insets.bottom)
            WindowInsetsCompat.CONSUMED
        }

        // Permanent Top Brand Header (ALWAYS visible above WebView on Home, Buy, Sell, Rent, Details, Favorites, Profile)
        val headerId = View.generateViewId()
        val triColorStripDrawable = GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            intArrayOf(
                Color.parseColor("#047857"),
                Color.parseColor("#D97706"),
                Color.parseColor("#DC2626")
            )
        )

        val headerLogoCardBg = GradientDrawable().apply {
            setColor(Color.WHITE)
            cornerRadius = dp(12).toFloat()
            setStroke(dp(1), Color.parseColor("#A7F3D0"))
        }

        nativeHeaderBar = LinearLayout(this).apply {
            id = headerId
            orientation = LinearLayout.VERTICAL
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                addRule(RelativeLayout.ALIGN_PARENT_TOP)
            }
            setBackgroundColor(Color.WHITE)
            elevation = dp(6).toFloat()
            isClickable = true
            isFocusable = true
        }

        val headerTopAccent = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(3)
            )
            background = triColorStripDrawable
        }

        val headerRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            setPadding(dp(12), dp(8), dp(12), dp(8))
        }

        // Official Colorful House Logo Image (NEVER replaced with generic icon)
        val headerLogoFrame = FrameLayout(this).apply {
            layoutParams = LinearLayout.LayoutParams(dp(46), dp(46)).apply {
                marginEnd = dp(10)
            }
            background = headerLogoCardBg
            setPadding(dp(3), dp(3), dp(3), dp(3))
        }

        val headerLogoImg = ImageView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setImageResource(R.drawable.splash_logo)
            scaleType = ImageView.ScaleType.FIT_CENTER
            adjustViewBounds = true
            contentDescription = "Mana Gruham Official Logo"
        }
        headerLogoFrame.addView(headerLogoImg)

        val headerTextColumn = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_VERTICAL
            layoutParams = LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1f
            )
        }

        val headerTitleEn = TextView(this).apply {
            text = "Mana Gruham"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 20f)
            typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
            maxLines = 1
            includeFontPadding = false
            val textWidth = paint.measureText("Mana Gruham").coerceAtLeast(dp(135).toFloat())
            paint.shader = LinearGradient(
                0f,
                0f,
                textWidth,
                0f,
                intArrayOf(
                    Color.parseColor("#047857"), // Emerald Green
                    Color.parseColor("#D97706"), // Gold
                    Color.parseColor("#DC2626")  // Red
                ),
                floatArrayOf(0f, 0.52f, 1f),
                Shader.TileMode.CLAMP
            )
        }

        val headerTitleTe = TextView(this).apply {
            text = "మన గృహం రియల్ యాప్"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 12f)
            setTextColor(Color.parseColor("#065F46"))
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 1
            includeFontPadding = false
            setPadding(0, dp(2), 0, 0)
        }

        headerTextColumn.addView(headerTitleEn)
        headerTextColumn.addView(headerTitleTe)

        val headerVerifiedBadge = TextView(this).apply {
            text = "✓ Verified"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 10.5f)
            setTextColor(Color.parseColor("#065F46"))
            typeface = Typeface.DEFAULT_BOLD
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.verified_pill_bg)
            setPadding(dp(10), dp(5), dp(10), dp(5))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                marginStart = dp(8)
            }
        }

        headerRow.addView(headerLogoFrame)
        headerRow.addView(headerTextColumn)
        headerRow.addView(headerVerifiedBadge)

        val headerBottomDivider = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(1)
            )
            setBackgroundColor(Color.parseColor("#D1FAE5"))
        }

        nativeHeaderBar.addView(headerTopAccent)
        nativeHeaderBar.addView(headerRow)
        nativeHeaderBar.addView(headerBottomDivider)

        // Tapping the permanent top logo/header cleanly returns to Home
        nativeHeaderBar.setOnClickListener {
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('managruham:goHome'))",
                null
            )
        }

        webView = WebView(this).apply {
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT
            ).apply {
                addRule(RelativeLayout.BELOW, headerId)
            }
            setBackgroundColor(Color.WHITE)
            alpha = 0f // Keep invisible cleanly until splash fades out
        }

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            val params = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                dp(3)
            )
            params.addRule(RelativeLayout.BELOW, headerId)
            layoutParams = params
            progressDrawable?.setColorFilter(Color.parseColor("#10B981"), PorterDuff.Mode.SRC_IN)
            max = 100
        }

        // Premium Animated Colorful Splash Overlay (Emerald Green, Gold, Blue, Purple, White)
        val splashGradientBg = GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(
                Color.parseColor("#ECFDF5"),
                Color.parseColor("#FFFFFF"),
                Color.parseColor("#EFF6FF")
            )
        )

        splashOverlay = RelativeLayout(this).apply {
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT
            )
            background = splashGradientBg
            elevation = dp(16).toFloat()
        }

        val splashContent = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                RelativeLayout.LayoutParams.MATCH_PARENT
            )
            setPadding(dp(28), dp(24), dp(28), dp(24))
        }

        // Top multi-color accent bar (Emerald Green -> Gold -> Royal Blue -> Purple)
        val topAccentDrawable = GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            intArrayOf(
                Color.parseColor("#10B981"),
                Color.parseColor("#F59E0B"),
                Color.parseColor("#2563EB"),
                Color.parseColor("#7C3AED")
            )
        )
        val topAccentBar = View(this).apply {
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                dp(6)
            ).apply {
                addRule(RelativeLayout.ALIGN_PARENT_TOP)
            }
            background = topAccentDrawable
        }

        // Bottom multi-color accent bar
        val bottomAccentBar = View(this).apply {
            layoutParams = RelativeLayout.LayoutParams(
                RelativeLayout.LayoutParams.MATCH_PARENT,
                dp(5)
            ).apply {
                addRule(RelativeLayout.ALIGN_PARENT_BOTTOM)
            }
            background = topAccentDrawable
        }

        // Framed Official House Logo (FIT_CENTER with padding -> NEVER cut off, ALWAYS visible from frame 1)
        val logoCard = FrameLayout(this).apply {
            val size = dp(176)
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                bottomMargin = dp(22)
            }
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.splash_logo_card)
            elevation = dp(12).toFloat()
            setPadding(dp(14), dp(14), dp(14), dp(14))
            scaleX = 0.90f
            scaleY = 0.90f
            alpha = 1f
        }

        val logoImage = ImageView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setImageResource(R.drawable.splash_logo)
            scaleType = ImageView.ScaleType.FIT_CENTER
            adjustViewBounds = true
            contentDescription = "Mana Gruham Official House Logo"
        }
        logoCard.addView(logoImage)

        val titleEn = TextView(this).apply {
            text = "Mana Gruham"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 32f)
            setTextColor(Color.parseColor("#065F46"))
            typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
            gravity = Gravity.CENTER
            alpha = 1f
        }

        val titleTe = TextView(this).apply {
            text = "మన గృహం రియల్ యాప్"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 20f)
            setTextColor(Color.parseColor("#2563EB"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            setPadding(0, dp(6), 0, 0)
            alpha = 1f
        }

        val taglineBadge = TextView(this).apply {
            text = "✓  100% Verified Listings"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
            setTextColor(Color.parseColor("#065F46"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            background = ContextCompat.getDrawable(this@MainActivity, R.drawable.verified_pill_bg)
            setPadding(dp(20), dp(9), dp(20), dp(9))
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dp(18)
            }
            alpha = 1f
        }

        val categoryRibbon = TextView(this).apply {
            text = "Buy  •  Sell  •  Rent  •  Commercial  •  Lands"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 11f)
            setTextColor(Color.parseColor("#7C3AED"))
            typeface = Typeface.DEFAULT_BOLD
            gravity = Gravity.CENTER
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = dp(14)
            }
            alpha = 1f
        }

        val splashSpinner = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            isIndeterminate = true
            indeterminateDrawable?.setColorFilter(Color.parseColor("#10B981"), PorterDuff.Mode.SRC_IN)
            layoutParams = LinearLayout.LayoutParams(dp(200), dp(6)).apply {
                topMargin = dp(26)
            }
        }

        splashContent.addView(logoCard)
        splashContent.addView(titleEn)
        splashContent.addView(titleTe)
        splashContent.addView(taglineBadge)
        splashContent.addView(categoryRibbon)
        splashContent.addView(splashSpinner)

        splashOverlay.addView(splashContent)
        splashOverlay.addView(topAccentBar)
        splashOverlay.addView(bottomAccentBar)

        // Subtle entrance bounce while keeping alpha=1f so logo never hides if animations are off
        logoCard.animate()
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(480)
            .setInterpolator(OvershootInterpolator(1.08f))
            .start()

        rootLayout.addView(nativeHeaderBar)
        rootLayout.addView(webView)
        rootLayout.addView(progressBar)
        rootLayout.addView(splashOverlay)

        setContentView(rootLayout)

        // Configure WebView
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                progressBar.visibility = View.VISIBLE
                progressBar.progress = 15
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                progressBar.visibility = View.GONE
                pageFinished = true
                scheduleRevealWebView()
            }

            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("whatsapp:") || url.contains("wa.me") || url.startsWith("tel:") || url.startsWith("mailto:")) {
                    try {
                        startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                        return true
                    } catch (e: Exception) {
                        Toast.makeText(this@MainActivity, "పరికరంలో తగిన యాప్ కనుగొనబడలేదు", Toast.LENGTH_SHORT).show()
                        return true
                    }
                }
                return false
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true && !fallbackTriggered) {
                    val url = request.url?.toString() ?: ""
                    if (url.startsWith("https://")) {
                        fallbackTriggered = true
                        webView.loadUrl(fallbackLocalUrl)
                    }
                }
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                super.onProgressChanged(view, newProgress)
                progressBar.progress = newProgress
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                request?.grant(request.resources)
            }

            // Support property photos, videos, and PDF documents
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback
                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("image/*", "video/*", "application/pdf"))
                    putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                }
                startActivityForResult(
                    Intent.createChooser(intent, "ఫోటో / వీడియో / డాక్యుమెంట్ ఎంచుకోండి"),
                    FILE_CHOOSER_RESULT_CODE
                )
                return true
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        // Safety fallback if network hangs so user NEVER sees an indefinite splash or blank screen
        mainHandler.postDelayed({
            if (!pageFinished && !fallbackTriggered) {
                fallbackTriggered = true
                webView.loadUrl(fallbackLocalUrl)
            }
        }, 6500L)

        // Load app
        webView.loadUrl(liveUrl)
    }

    private fun scheduleRevealWebView() {
        if (splashDismissed) return
        val elapsed = SystemClock.elapsedRealtime() - launchTimeMs
        val remaining = (minSplashDurationMs - elapsed).coerceAtLeast(0L)
        mainHandler.postDelayed({
            if (!splashDismissed && !isFinishing) {
                splashDismissed = true
                webView.animate().alpha(1f).setDuration(350).start()
                splashOverlay.animate().alpha(0f).setDuration(350).withEndAction {
                    splashOverlay.visibility = View.GONE
                }.start()
            }
        }, remaining)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            val callback = fileUploadCallback ?: return
            var results: Array<Uri>? = null
            if (resultCode == RESULT_OK && data != null) {
                val clipData = data.clipData
                if (clipData != null && clipData.itemCount > 0) {
                    results = Array(clipData.itemCount) { i -> clipData.getItemAt(i).uri }
                } else if (data.data != null) {
                    results = arrayOf(data.data!!)
                }
            }
            callback.onReceiveValue(results)
            fileUploadCallback = null
        }
    }

    override fun onDestroy() {
        mainHandler.removeCallbacksAndMessages(null)
        super.onDestroy()
    }
}
"""
    with open(os.path.join(base_dir, "app/src/main/java/com/managruham/realapp/MainActivity.kt"), "w", encoding="utf-8") as f:
        f.write(content)

def write_gradlew_scripts(base_dir):
    content_linux = """#!/bin/sh
exec gradle "$@"
"""
    content_windows = """@echo off
gradle %*
"""
    with open(os.path.join(base_dir, "gradlew"), "w", encoding="utf-8") as f:
        f.write(content_linux)
    os.chmod(os.path.join(base_dir, "gradlew"), 0o755)

    with open(os.path.join(base_dir, "gradlew.bat"), "w", encoding="utf-8") as f:
        f.write(content_windows)

def write_github_workflow(base_dir):
    content = """name: Build Android APK

on:
  workflow_dispatch:
  push:
    branches: [ main, master ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Setup Gradle
        uses: gradle/actions/setup-gradle@v3
        with:
          gradle-version: '8.5'

      - name: Build Debug APK
        run: gradle assembleDebug

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ManaGruham-RealApp-Debug-APK
          path: app/build/outputs/apk/debug/app-debug.apk
"""
    with open(os.path.join(base_dir, ".github/workflows/build-apk.yml"), "w", encoding="utf-8") as f:
        f.write(content)

def copy_and_adapt_web_assets(base_dir):
    dist_dir = "dist"
    assets_target_dir = os.path.join(base_dir, "app/src/main/assets")

    if not os.path.exists(dist_dir):
        print(f"Error: {dist_dir} does not exist. Cannot copy web assets.")
        return False

    print(f"Copying web assets from {dist_dir} to {assets_target_dir}...")
    if os.path.exists(assets_target_dir):
        shutil.rmtree(assets_target_dir)
    os.makedirs(assets_target_dir, exist_ok=True)

    for root, dirs, files in os.walk(dist_dir):
        # Skip copying existing archive ZIPs or user uploads into the APK bundle
        dirs[:] = [d for d in dirs if d != "uploads"]
        relative_path = os.path.relpath(root, dist_dir)
        dest_dir = assets_target_dir if relative_path == "." else os.path.join(assets_target_dir, relative_path)
        os.makedirs(dest_dir, exist_ok=True)
        for file in files:
            if file.endswith((".zip", ".apk")):
                continue
            shutil.copy2(os.path.join(root, file), os.path.join(dest_dir, file))

    index_path = os.path.join(assets_target_dir, "index.html")
    if os.path.exists(index_path):
        with open(index_path, "r", encoding="utf-8") as f:
            adapted_html = f.read()

        replacements = [
            ('="/assets/', '="./assets/'),
            ('href="/assets/', 'href="./assets/'),
            ('src="/assets/', 'src="./assets/'),
            ('="/favicon.ico"', '="./favicon.ico"'),
            ('="/icon.svg"', '="./icon.svg"'),
            ('="/icon.png"', '="./icon.png"'),
            ('="/apple-touch-icon.png"', '="./apple-touch-icon.png"'),
            ('="/manifest.webmanifest"', '="./manifest.webmanifest"'),
            ('="/pwa-192x192.png"', '="./pwa-192x192.png"'),
            ('="/pwa-512x512.png"', '="./pwa-512x512.png"'),
        ]
        for old, new in replacements:
            adapted_html = adapted_html.replace(old, new)

        with open(index_path, "w", encoding="utf-8") as f:
            f.write(adapted_html)
        print("Successfully adapted index.html for relative offline loading.")
    return True

def zip_project(base_dir):
    zip_dir = "public"
    os.makedirs(zip_dir, exist_ok=True)
    zip_filename = os.path.join(zip_dir, "ManaGruham_AndroidProject.zip")

    print(f"Creating ZIP archive {zip_filename}...")
    with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(base_dir):
            for file in files:
                filepath = os.path.join(root, file)
                archive_name = os.path.relpath(filepath, base_dir)
                zipf.write(filepath, os.path.join("ManaGruham_AndroidProject", archive_name))
    print(f"Zip completed: {zip_filename}")
    return zip_filename

def main():
    base_dir = setup_android_structure()
    # Generate all official logo PNG/ICO assets BEFORE running vite build so dist/ includes them!
    generate_all_logo_assets(base_dir)

    if not build_web_assets():
        print("Web build failed! Proceeding with Android project generation, but dist/ assets may be incomplete.")

    write_gradle_wrapper_properties(base_dir)
    write_settings_gradle_kts(base_dir)
    write_settings_gradle_groovy(base_dir)
    write_local_properties(base_dir)
    write_project_build_gradle_kts(base_dir)
    write_gradle_properties(base_dir)
    write_app_build_gradle_kts(base_dir)
    write_proguard_rules(base_dir)
    write_android_manifest(base_dir)
    write_network_security_config(base_dir)
    write_colors_xml(base_dir)
    write_strings_xml(base_dir)
    write_drawables_and_themes(base_dir)
    write_main_activity_kt(base_dir)
    write_gradlew_scripts(base_dir)
    write_github_workflow(base_dir)

    copy_and_adapt_web_assets(base_dir)
    zip_path = zip_project(base_dir)
    shutil.copy2(zip_path, os.path.join("public", "android_project.zip"))

    print("\n=============================================")
    print("SUCCESS: Android Studio Project & Logo Assets complete!")
    print(f"Download zip available at: {zip_path}")
    print("=============================================")

if __name__ == "__main__":
    main()
