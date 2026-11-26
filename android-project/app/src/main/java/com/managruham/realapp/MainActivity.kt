package com.managruham.realapp

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
