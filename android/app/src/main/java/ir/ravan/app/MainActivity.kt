package ir.ravan.app

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.view.View
import android.view.WindowInsets
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.window.OnBackInvokedDispatcher
import androidx.webkit.WebViewAssetLoader
import org.json.JSONObject
import java.io.ByteArrayInputStream
import java.util.Locale

class MainActivity : Activity() {
    private lateinit var webView: WebView
    private lateinit var speech: TextToSpeech
    @Volatile private var speechReady = false
    @Volatile private var activeToken = ""
    private val appUrl = "https://appassets.androidplatform.net/assets/index.html"

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = FrameLayout(this).apply { setBackgroundColor(Color.rgb(248, 249, 245)) }
        if (Build.VERSION.SDK_INT >= 30) {
            window.setDecorFitsSystemWindows(false)
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_LAYOUT_STABLE or
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION or
                View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR or View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR
        }
        root.setOnApplyWindowInsetsListener { view, insets ->
            if (Build.VERSION.SDK_INT >= 30) {
                val bars = insets.getInsets(WindowInsets.Type.systemBars() or WindowInsets.Type.displayCutout())
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            } else {
                @Suppress("DEPRECATION")
                view.setPadding(insets.systemWindowInsetLeft, insets.systemWindowInsetTop,
                    insets.systemWindowInsetRight, insets.systemWindowInsetBottom)
            }
            insets
        }
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        webView = WebView(this).apply {
            setBackgroundColor(Color.rgb(248, 249, 245))
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = false
            settings.mixedContentMode = android.webkit.WebSettings.MIXED_CONTENT_NEVER_ALLOW
            settings.blockNetworkLoads = true
            settings.cacheMode = android.webkit.WebSettings.LOAD_NO_CACHE
            clearCache(true)
            clearHistory()
            settings.javaScriptCanOpenWindowsAutomatically = false
            webChromeClient = WebChromeClient()
            addJavascriptInterface(SpeechBridge(), "AndroidSpeech")
            webViewClient = object : WebViewClient() {
                override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                    val url = request.url
                    return url.scheme != "https" || url.host != "appassets.androidplatform.net" ||
                        url.path?.startsWith("/assets/") != true
                }
                override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse {
                    return assetLoader.shouldInterceptRequest(request.url)
                        ?: WebResourceResponse("text/plain", "UTF-8", 403, "Forbidden", emptyMap(), ByteArrayInputStream(ByteArray(0)))
                }
            }
        }
        root.addView(webView, FrameLayout.LayoutParams(-1, -1))
        setContentView(root)
        speech = TextToSpeech(this) { status ->
            if (status == TextToSpeech.SUCCESS && !isDestroyed) {
                val availability = speech.setLanguage(Locale.forLanguageTag("tr-TR"))
                speechReady = availability >= TextToSpeech.LANG_AVAILABLE
            }
        }
        speech.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(utteranceId: String) = reportSpeech("start", utteranceId)
            override fun onDone(utteranceId: String) = reportSpeech("done", utteranceId)
            @Deprecated("Android compatibility callback")
            override fun onError(utteranceId: String) = reportSpeech("error", utteranceId)
            override fun onError(utteranceId: String, errorCode: Int) = reportSpeech("error", utteranceId)
        })
        webView.loadUrl(appUrl)
        if (Build.VERSION.SDK_INT >= 33) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT) { handleBack() }
        }
    }

    private fun reportSpeech(status: String, token: String) {
        runOnUiThread {
            if (!isDestroyed) webView.evaluateJavascript(
                "window.onNativeSpeechStatus?.(${JSONObject.quote(status)},${JSONObject.quote(token)})", null)
        }
    }

    inner class SpeechBridge {
        @JavascriptInterface
        fun speak(text: String, rate: Double, token: String): Boolean {
            if (!speechReady || text.isBlank() || text.length > 500 || !rate.isFinite() || rate !in 0.5..1.5 ||
                !token.matches(Regex("\\d{1,20}"))) return false
            runOnUiThread {
                if (!isDestroyed) {
                    activeToken = token
                    speech.setSpeechRate(rate.toFloat())
                    if (speech.speak(text, TextToSpeech.QUEUE_FLUSH, null, token) == TextToSpeech.ERROR) {
                        reportSpeech("error", token)
                    }
                }
            }
            return true
        }

        @JavascriptInterface
        fun stop() {
            runOnUiThread { if (!isDestroyed && ::speech.isInitialized) speech.stop() }
        }
    }

    private fun handleBack() {
        webView.evaluateJavascript("window.closeRavanLesson?.() === true") { handled ->
            if (handled != "true") finish()
        }
    }

    @Deprecated("Legacy Android back navigation")
    override fun onBackPressed() = handleBack()

    override fun onPause() {
        if (::speech.isInitialized) {
            speech.stop()
            reportSpeech("done", activeToken)
        }
        super.onPause()
    }

    override fun onDestroy() {
        speechReady = false
        if (::speech.isInitialized) {
            speech.stop()
            speech.shutdown()
        }
        webView.removeJavascriptInterface("AndroidSpeech")
        webView.destroy()
        super.onDestroy()
    }
}
