package io.ionic.starter;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

import io.ionic.starter.evidencias.EvidenciasColaPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EvidenciasColaPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
