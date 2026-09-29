package io.ionic.starter.evidencias;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "EvidenciasCola")
public class EvidenciasColaPlugin extends Plugin {

    @PluginMethod
    public void procesar(PluginCall call) {
        EvidenciasWorker.programar(getContext());
        call.resolve();
    }
}
