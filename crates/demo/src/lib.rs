mod utils;

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet() -> String {
    return "Hello, demo-wasm-pack!".to_string()
}
