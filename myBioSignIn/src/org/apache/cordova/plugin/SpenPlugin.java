package org.apache.cordova.plugin;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.annotation.SuppressLint;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;


@SuppressLint("ClickableViewAccessibility")
public class SpenPlugin extends CordovaPlugin implements View.OnTouchListener{

	private int pointerId = 0;
	public CallbackContext callback;
	public View frame;
	
	
	public void initialize(CordovaInterface cordova, CordovaWebView webView) {
		frame = (View) cordova.getActivity().findViewById(android.R.id.content);
		cordova.getActivity();
		super.initialize(cordova, webView);
	}

	public boolean execute(String action, JSONArray args,
			CallbackContext callbackContext) throws JSONException {
		this.callback = callbackContext;

		if (action.equals("penEvents")) {
			webView.setOnTouchListener(this);
		} else {
			callbackContext.error("Wrong action name in plugin");
			return false;
		}
		return true;
	}

	public JSONObject createData(MotionEvent e) {

		JSONObject data = new JSONObject();

		// Create data array with touch info
		try {
			data.put("x", e.getX(pointerId));
			data.put("y", e.getY(pointerId));
			data.put("pressure", e.getPressure(pointerId));
			data.put("time", e.getEventTime());
			
		} catch (JSONException ex) {
			Log.d("Spen", "Exception setting event data");
		}

		return data;
	}

	 private boolean isPenEvent(MotionEvent event) {
	        return event.getToolType(0) == MotionEvent.TOOL_TYPE_STYLUS;
	    }

	 public void fireEvent(String type, JSONObject data) {

			if (data == null) {
				data = new JSONObject();
			}

			// Add type to data array
			try {
				data.put("type", type);
			} catch (JSONException ex) {
				Log.d("Spen", "Exception setting type on event data");
			}

			// Define javascript code and target webview
			final String js = "javascript:try{cordova.fireDocumentEvent('"
					+ type
					+ "'"
					+ (data != null ? "," + data : "")
					+ " );}catch(e){console.log('exception firing gesture event from native');};";
			//final CordovaWebView webview = webView;

			// Send javascript to target
			webView.post(new Runnable() {
				@Override
				public void run() {
					webView.loadUrl(js);
				}
			});
		}

	@Override
	public boolean onTouch(View v, MotionEvent e) {
		if (isPenEvent(e)) {
            pointerId = e.getPointerId(0);
            int action = e.getAction();

            String actionStr;

            switch (action) {
                case MotionEvent.ACTION_DOWN:
                    actionStr = "ACTION_DOWN";
                    break;
                case MotionEvent.ACTION_MOVE:
                    actionStr = "ACTION_MOVE";
                    break;
                case MotionEvent.ACTION_UP:
                    actionStr = "ACTION_UP";
                    break;
                default:
                    actionStr = "ACTION_UNKNOWN";
            }

           fireEvent(actionStr,createData(e));
           
        }

        return webView.onTouchEvent(e);
	}

}
