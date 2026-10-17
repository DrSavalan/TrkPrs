plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "ir.ravan.app"
    compileSdk = 35
    defaultConfig {
        applicationId = "ir.ravan.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    sourceSets.getByName("main").assets.srcDir(layout.buildDirectory.dir("generated/ravanAssets"))
}

val syncWebAssets by tasks.registering(Copy::class) {
    from(rootProject.projectDir.parentFile) {
        include("index.html", "styles.css", "app.js", "core.js", "data.js", "manifest.webmanifest", "sw.js")
        include("assets/*.ttf", "assets/*.svg", "assets/*.png")
    }
    into(layout.buildDirectory.dir("generated/ravanAssets"))
}
tasks.named("preBuild") { dependsOn(syncWebAssets) }

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}
