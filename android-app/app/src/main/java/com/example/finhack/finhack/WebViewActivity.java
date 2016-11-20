package com.example.finhack.finhack;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class WebViewActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_web_view);

        WebView wv = (WebView)findViewById(R.id.webview);
        wv.setWebViewClient(new WebViewClient());
        wv.clearCache(true);

        WebSettings webSettings = wv.getSettings();
        webSettings.setJavaScriptEnabled(true);

        wv.loadUrl("http://10.102.200.159:3000/login");
    }
}
