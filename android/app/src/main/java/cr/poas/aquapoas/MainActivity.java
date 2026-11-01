package cr.poas.aquapoas;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;

import androidx.webkit.WebViewAssetLoader;

/**
 * AquaPoás: app independiente del observatorio del agua del cantón de Poás.
 * La interfaz va empaquetada en assets/app y se sirve desde un origen https local
 * (WebViewAssetLoader), de modo que funciona sin conexión; los datos en vivo
 * (Open-Meteo, mapas) se descargan cuando hay internet.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/app/index.html";

    private WebView webView;
    private WebViewAssetLoader assetLoader;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#F2F8FB"));

        // Franja azul bajo la barra de estado y blanca bajo la barra de navegación
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        View topBar = new View(this);
        topBar.setBackgroundColor(Color.parseColor("#0077B6"));
        View bottomBar = new View(this);
        bottomBar.setBackgroundColor(Color.WHITE);
        root.addView(topBar, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0));
        root.addView(webView, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(bottomBar, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0));
        setContentView(root);
        applySystemBarInsets(root, topBar, bottomBar);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setSupportMultipleWindows(true);
        s.setJavaScriptCanOpenWindowsAutomatically(true);
        s.setMediaPlaybackRequiresUserGesture(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (HOST.equals(uri.getHost())) return false; // pantallas de la app
                openExternal(uri);                            // WhatsApp, tel:, sitios externos
                return true;
            }
        });

        // window.open(...) / target="_blank": se abre fuera de la app
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                WebView temp = new WebView(MainActivity.this);
                temp.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
                        Uri uri = request.getUrl();
                        if (HOST.equals(uri.getHost())) webView.loadUrl(uri.toString());
                        else openExternal(uri);
                        v.destroy();
                        return true;
                    }
                });
                WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(temp);
                resultMsg.sendToTarget();
                return true;
            }
        });

        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        else webView.loadUrl(START_URL);
    }

    private void openExternal(Uri uri) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, uri);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException ignored) {
            // No hay aplicación para abrir el enlace
        }
    }

    /** Android 15 dibuja de borde a borde: reservar el espacio de las barras del sistema. */
    private void applySystemBarInsets(View root, View topBar, View bottomBar) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) return; // en versiones previas el sistema ya reserva el espacio
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            android.graphics.Insets bars = insets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            topBar.getLayoutParams().height = bars.top;
            bottomBar.getLayoutParams().height = bars.bottom;
            view.setPadding(bars.left, 0, bars.right, 0);
            topBar.requestLayout();
            bottomBar.requestLayout();
            return WindowInsets.CONSUMED;
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        webView.saveState(outState);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
