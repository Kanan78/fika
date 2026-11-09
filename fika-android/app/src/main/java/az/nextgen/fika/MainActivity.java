package az.nextgen.fika;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.view.Gravity;
import com.chaquo.python.Python;
import com.chaquo.python.android.AndroidPlatform;
import java.io.*;
import java.util.zip.*;

public class MainActivity extends Activity {
    private WebView web;
    private static final String ORIGIN = "http://127.0.0.1:8754";
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout layout = new FrameLayout(this);
        layout.setBackgroundColor(Color.WHITE);
        web = new WebView(this);
        layout.addView(web, new FrameLayout.LayoutParams(-1, -1));
        ProgressBar spinner = new ProgressBar(this);
        FrameLayout.LayoutParams loading = new FrameLayout.LayoutParams(100, 100, Gravity.CENTER);
        layout.addView(spinner, loading);
        setContentView(layout);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public void onPageFinished(WebView view, String url) { spinner.setVisibility(android.view.View.GONE); }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri uri = req.getUrl();
                if (local(uri)) return false;
                if (req.hasGesture() && ("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))) {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                }
                return true;
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri uri = req.getUrl();
                if (local(uri) || "data".equals(uri.getScheme()) || "blob".equals(uri.getScheme())) return null;
                return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
            }
        });
        new Thread(() -> {
            try {
                File runtime = new File(getFilesDir(), "fika-runtime-" + BuildConfig.RUNTIME_VERSION);
                extractRuntime(runtime);
                if (!Python.isStarted()) Python.start(new AndroidPlatform(getApplicationContext()));
                Python.getInstance().getModule("fika_server").callAttr("start", runtime.getAbsolutePath(), 8754);
                runOnUiThread(() -> web.loadUrl(ORIGIN + "/"));
            } catch (Exception error) {
                runOnUiThread(() -> new AlertDialog.Builder(this).setTitle("Fika could not start")
                    .setMessage(error.toString()).setPositiveButton("Try again", (dialog, which) -> recreate())
                    .setNegativeButton("Close", (dialog, which) -> finish()).show());
            }
        }, "Fika-startup").start();
    }
    private boolean local(Uri uri) {
        return "http".equals(uri.getScheme()) && "127.0.0.1".equals(uri.getHost()) && uri.getPort() == 8754;
    }
    private void extractRuntime(File root) throws IOException {
        if (new File(root, ".ready").exists()) return;
        root.mkdirs();
        String prefix = root.getCanonicalPath() + File.separator;
        try (ZipInputStream input = new ZipInputStream(getAssets().open("fika-runtime.zip"))) {
            ZipEntry entry;
            byte[] buffer = new byte[16384];
            while ((entry = input.getNextEntry()) != null) {
                File target = new File(root, entry.getName());
                if (!target.getCanonicalPath().startsWith(prefix)) throw new IOException("Invalid runtime path");
                if (entry.isDirectory()) { target.mkdirs(); continue; }
                target.getParentFile().mkdirs();
                try (OutputStream output = new FileOutputStream(target)) {
                    int count;
                    while ((count = input.read(buffer)) > 0) output.write(buffer, 0, count);
                }
            }
        }
        new File(root, ".ready").createNewFile();
    }
    @Override public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
