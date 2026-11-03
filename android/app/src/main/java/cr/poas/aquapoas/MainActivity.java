package cr.poas.aquapoas;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Message;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

import androidx.webkit.WebViewAssetLoader;

/**
 * Observatorio del Agua-Poás · Gobernanza del Agua.
 * La interfaz va empaquetada en assets/app y se sirve desde un origen https local
 * (WebViewAssetLoader), de modo que funciona sin conexión; los datos en vivo
 * (Open-Meteo, mapas) se descargan cuando hay internet.
 * Puente nativo: guardar archivos exportados (CSV) en Descargas e imprimir a PDF.
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String START_URL = "https://" + HOST + "/assets/app/index.html";

    private static final int REQ_FILE = 41;
    private static final int MAX_EXPORT_CHARS = 5_000_000;

    private WebView webView;
    private WebViewAssetLoader assetLoader;
    private ValueCallback<Uri[]> fileCallback;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        assetLoader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        boolean dark = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        int fondo = Color.parseColor(dark ? "#0A1524" : "#EDF5FB");

        webView = new WebView(this);
        webView.setBackgroundColor(fondo);

        // Franja azul bajo la barra de estado y del color del pie bajo la barra de navegación
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(fondo);
        View topBar = new View(this);
        topBar.setBackgroundColor(Color.parseColor("#0066A1"));
        View bottomBar = new View(this);
        bottomBar.setBackgroundColor(fondo);
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
        webView.addJavascriptInterface(new Puente(), "ObservatorioNativo");

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

            // <input type="file">: selector de imágenes del sistema (no requiere permisos)
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("image/*");
                i.putExtra(Intent.EXTRA_MIME_TYPES, new String[]{"image/jpeg", "image/png", "image/webp"});
                try {
                    startActivityForResult(Intent.createChooser(i, "Elegí una fotografía"), REQ_FILE);
                } catch (ActivityNotFoundException e) {
                    fileCallback = null;
                    return false;
                }
                return true;
            }
        });

        if (savedInstanceState != null) webView.restoreState(savedInstanceState);
        else webView.loadUrl(START_URL);

        // Android 13+ (obligatorio con targetSdk 36): el botón/gesto Atrás llega por OnBackInvokedCallback,
        // ya no por onBackPressed(). Atrás retrocede en la app (pestañas, fichas) y sale al llegar al inicio.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            backCallback = () -> {
                if (webView.canGoBack()) webView.goBack();
                else finish();
            };
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT, backCallback);
        }
    }

    private OnBackInvokedCallback backCallback;

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != REQ_FILE || fileCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null && data.getData() != null) result = new Uri[]{data.getData()};
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    /** Funciones nativas expuestas a la interfaz como window.ObservatorioNativo. */
    private class Puente {
        @JavascriptInterface
        public String guardarArchivo(String nombre, String mime, String contenido) {
            if (contenido == null || contenido.length() > MAX_EXPORT_CHARS) return "El archivo es demasiado grande para exportarlo.";
            String limpio = (nombre == null ? "exportacion.csv" : nombre).replaceAll("[^A-Za-z0-9._-]", "_");
            String tipo = "text/csv".equals(mime) ? "text/csv" : "text/plain";
            byte[] bytes = contenido.getBytes(StandardCharsets.UTF_8);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, limpio);
                    v.put(MediaStore.Downloads.MIME_TYPE, tipo);
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    if (uri == null) return "No se pudo crear el archivo.";
                    try (OutputStream out = getContentResolver().openOutputStream(uri)) {
                        if (out == null) return "No se pudo escribir el archivo.";
                        out.write(bytes);
                    }
                    return "✅ Guardado en Descargas: " + limpio;
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    if (dir == null) return "Almacenamiento no disponible.";
                    File f = new File(dir, limpio);
                    try (FileOutputStream out = new FileOutputStream(f)) { out.write(bytes); }
                    return "✅ Guardado en: " + f.getAbsolutePath();
                }
            } catch (Exception e) {
                return "No se pudo guardar el archivo: " + e.getMessage();
            }
        }

        @JavascriptInterface
        public void imprimir(String titulo) {
            final String t = (titulo == null || titulo.isEmpty()) ? "Observatorio del Agua-Poás" : titulo;
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                if (pm != null) pm.print(t, webView.createPrintDocumentAdapter(t), new PrintAttributes.Builder().build());
            });
        }
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

    // Solo para Android 12 o anterior; en Android 13+ se usa backCallback.
    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && backCallback != null) {
            getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(backCallback);
        }
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
