"""
Crop Disease Detection using CNN (MobileNetV2 Transfer Learning)
Trained on PlantVillage dataset
Image-based quality assessment using Convolutional Neural Network
Input: 224x224 RGB crop image
Output: Disease class + confidence score
"""
import numpy as np
import os
import json

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "models", "disease_model.h5")
CLASSES_PATH = os.path.join(BASE_DIR, "models", "disease_classes.json")
DATASET_PATH = os.path.join(os.path.dirname(BASE_DIR), "PlantVillage")

# Disease info for treatment recommendations
DISEASE_INFO = {
    'Pepper__bell___Bacterial_spot': {
        'crop': 'Pepper (Bell)', 'disease': 'Bacterial Spot', 'severity': 'High',
        'description': 'Bacterial spot is caused by Xanthomonas species. It causes dark, water-soaked lesions on leaves and fruits, leading to significant yield loss.',
        'symptoms': ['Small dark water-soaked spots on leaves', 'Spots enlarge and turn brown', 'Leaf edges may turn yellow', 'Raised scab-like spots on fruits'],
        'treatment': ['Apply copper-based bactericide', 'Remove infected plant parts', 'Avoid working with wet plants', 'Improve drainage'],
        'prevention': ['Use pathogen-free seeds', 'Crop rotation (3+ years)', 'Avoid overhead watering', 'Sanitize garden tools'],
    },
    'Pepper__bell___healthy': {
        'crop': 'Pepper (Bell)', 'disease': 'Healthy', 'severity': 'None',
        'description': 'The pepper plant appears healthy with no visible signs of disease.',
        'symptoms': ['No visible symptoms', 'Normal leaf coloration', 'Good growth pattern'],
        'treatment': ['Continue regular watering', 'Maintain fertilization schedule', 'Monitor regularly'],
        'prevention': ['Regular crop monitoring', 'Maintain soil health', 'Proper spacing'],
    },
    'Potato___Early_blight': {
        'crop': 'Potato', 'disease': 'Early Blight', 'severity': 'Medium',
        'description': 'Early blight caused by Alternaria solani creates dark concentric ring lesions on lower leaves of potato plants.',
        'symptoms': ['Dark brown spots with concentric rings', 'Yellowing of surrounding tissue', 'Lesions on lower older leaves', 'Premature leaf drop'],
        'treatment': ['Remove infected leaves', 'Apply copper-based fungicide (2g/L)', 'Ensure proper spacing', 'Water at base of plants', 'Apply mulch'],
        'prevention': ['Rotate crops every 2-3 years', 'Use disease-resistant varieties', 'Maintain proper nutrition'],
    },
    'Potato___Late_blight': {
        'crop': 'Potato', 'disease': 'Late Blight', 'severity': 'High',
        'description': 'Late blight caused by Phytophthora infestans is devastating and can destroy entire crops within days.',
        'symptoms': ['Water-soaked dark spots on leaves', 'White fuzzy growth on leaf undersides', 'Brown/black lesions on stems', 'Rapid plant wilting'],
        'treatment': ['Remove and destroy infected plants', 'Apply systemic fungicide immediately', 'Improve drainage', 'Do not compost infected material'],
        'prevention': ['Use certified disease-free seed', 'Avoid overhead irrigation', 'Ensure good air circulation', 'Apply preventive fungicides'],
    },
    'Potato___healthy': {
        'crop': 'Potato', 'disease': 'Healthy', 'severity': 'None',
        'description': 'The potato plant appears healthy with no visible signs of disease.',
        'symptoms': ['No visible symptoms', 'Normal leaf coloration', 'Good tuber development'],
        'treatment': ['Continue regular care', 'Maintain watering schedule', 'Monitor for pests'],
        'prevention': ['Regular monitoring', 'Proper hilling', 'Balanced fertilization'],
    },
    'Tomato_Bacterial_spot': {
        'crop': 'Tomato', 'disease': 'Bacterial Spot', 'severity': 'High',
        'description': 'Bacterial spot caused by Xanthomonas causes dark lesions on tomato leaves and fruits.',
        'symptoms': ['Small dark spots on leaves', 'Spots become raised and scabby', 'Fruit lesions', 'Defoliation in severe cases'],
        'treatment': ['Copper-based bactericide spray', 'Remove infected parts', 'Avoid overhead irrigation', 'Improve air circulation'],
        'prevention': ['Use disease-free transplants', 'Crop rotation', 'Sanitize tools', 'Resistant varieties'],
    },
    'Tomato_Early_blight': {
        'crop': 'Tomato', 'disease': 'Early Blight', 'severity': 'Medium',
        'description': 'Early blight caused by Alternaria solani creates target-like spots on tomato leaves.',
        'symptoms': ['Concentric ring spots (target-like)', 'Lower leaves affected first', 'Yellowing around spots', 'Premature defoliation'],
        'treatment': ['Remove infected leaves', 'Apply fungicide (chlorothalonil/mancozeb)', 'Mulch around plants', 'Stake plants for air flow'],
        'prevention': ['Crop rotation', 'Resistant varieties', 'Avoid wetting foliage', 'Remove plant debris'],
    },
    'Tomato_Late_blight': {
        'crop': 'Tomato', 'disease': 'Late Blight', 'severity': 'High',
        'description': 'Late blight by Phytophthora infestans causes rapid destruction of tomato plants in cool, wet conditions.',
        'symptoms': ['Large water-soaked blotches', 'White mold on leaf undersides', 'Brown stem lesions', 'Fruit rot'],
        'treatment': ['Destroy infected plants immediately', 'Apply copper fungicide', 'Do not compost', 'Systemic fungicide for remaining plants'],
        'prevention': ['Avoid wet conditions', 'Good ventilation', 'Disease-free transplants', 'Preventive fungicide sprays'],
    },
    'Tomato_Leaf_Mold': {
        'crop': 'Tomato', 'disease': 'Leaf Mold', 'severity': 'Medium',
        'description': 'Leaf mold caused by Passalora fulva thrives in humid greenhouse conditions.',
        'symptoms': ['Pale green/yellow spots on upper leaf', 'Olive-green fuzzy mold underneath', 'Leaves curl and wither', 'Reduced fruit set'],
        'treatment': ['Improve ventilation', 'Reduce humidity below 85%', 'Remove infected leaves', 'Apply fungicide if severe'],
        'prevention': ['Greenhouse ventilation', 'Avoid leaf wetness', 'Resistant varieties', 'Space plants adequately'],
    },
    'Tomato_Septoria_leaf_spot': {
        'crop': 'Tomato', 'disease': 'Septoria Leaf Spot', 'severity': 'Medium',
        'description': 'Septoria leaf spot caused by Septoria lycopersici produces many small spots on lower leaves.',
        'symptoms': ['Numerous small circular spots', 'Dark borders with gray centers', 'Lower leaves affected first', 'Severe defoliation'],
        'treatment': ['Remove infected lower leaves', 'Apply chlorothalonil fungicide', 'Mulch to prevent splash', 'Improve air circulation'],
        'prevention': ['Crop rotation (3 years)', 'Avoid overhead watering', 'Remove debris', 'Stake plants'],
    },
    'Tomato_Spider_mites_Two_spotted_spider_mite': {
        'crop': 'Tomato', 'disease': 'Spider Mites', 'severity': 'Medium',
        'description': 'Two-spotted spider mites cause stippling damage and webbing on tomato leaves.',
        'symptoms': ['Tiny yellow/white stippling on leaves', 'Fine webbing on undersides', 'Leaves turn bronze/brown', 'Premature leaf drop'],
        'treatment': ['Spray with water to dislodge mites', 'Apply insecticidal soap or neem oil', 'Release predatory mites', 'Apply miticide if severe'],
        'prevention': ['Monitor regularly', 'Maintain adequate moisture', 'Avoid dusty conditions', 'Encourage natural predators'],
    },
    'Tomato__Target_Spot': {
        'crop': 'Tomato', 'disease': 'Target Spot', 'severity': 'Medium',
        'description': 'Target spot caused by Corynespora cassiicola produces concentric ring lesions on tomato leaves.',
        'symptoms': ['Brown spots with concentric rings', 'Spots on leaves, stems, and fruit', 'Lesions may coalesce', 'Defoliation'],
        'treatment': ['Apply broad-spectrum fungicide', 'Remove infected debris', 'Improve air movement', 'Avoid overhead watering'],
        'prevention': ['Crop rotation', 'Clean cultivation', 'Adequate spacing', 'Fungicide program'],
    },
    'Tomato__Tomato_YellowLeaf__Curl_Virus': {
        'crop': 'Tomato', 'disease': 'Yellow Leaf Curl Virus', 'severity': 'High',
        'description': 'TYLCV is transmitted by whiteflies and causes severe stunting and yield loss in tomatoes.',
        'symptoms': ['Upward leaf curling', 'Yellowing leaf margins', 'Stunted plant growth', 'Reduced fruit production'],
        'treatment': ['Remove infected plants', 'Control whitefly populations', 'Use insecticides for vectors', 'No cure - manage vectors'],
        'prevention': ['Use resistant varieties', 'Control whiteflies early', 'Use reflective mulches', 'Install insect nets'],
    },
    'Tomato__Tomato_mosaic_virus': {
        'crop': 'Tomato', 'disease': 'Mosaic Virus', 'severity': 'High',
        'description': 'Tomato mosaic virus causes mottled coloring and distortion of leaves, reducing yield.',
        'symptoms': ['Light/dark green mosaic pattern', 'Leaf distortion and curling', 'Stunted growth', 'Reduced fruit quality'],
        'treatment': ['Remove infected plants immediately', 'Disinfect tools with bleach', 'No chemical treatment available', 'Control aphid vectors'],
        'prevention': ['Use virus-free seeds', 'Wash hands before handling', 'Disinfect tools', 'Control insect vectors'],
    },
    'Tomato_healthy': {
        'crop': 'Tomato', 'disease': 'Healthy', 'severity': 'None',
        'description': 'The tomato plant appears healthy with vigorous growth and no disease symptoms.',
        'symptoms': ['No visible symptoms', 'Normal green coloration', 'Good fruit development'],
        'treatment': ['Continue regular care', 'Maintain watering and fertilization', 'Monitor regularly'],
        'prevention': ['Regular monitoring', 'Balanced nutrition', 'Proper spacing', 'Clean garden practices'],
    },
}


def get_class_names():
    """Get disease class names from dataset or saved file"""
    if os.path.exists(CLASSES_PATH):
        with open(CLASSES_PATH, 'r') as f:
            return json.load(f)
    if os.path.exists(DATASET_PATH):
        classes = sorted([d for d in os.listdir(DATASET_PATH)
                         if os.path.isdir(os.path.join(DATASET_PATH, d)) and d != 'PlantVillage'])
        return classes
    return list(DISEASE_INFO.keys())


def build_and_train_model(epochs=10, batch_size=32):
    """Build and train CNN model on PlantVillage dataset"""
    import tensorflow as tf
    from tensorflow.keras.applications import MobileNetV2
    from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
    from tensorflow.keras.models import Model
    from tensorflow.keras.preprocessing.image import ImageDataGenerator

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)

    print(f"[Disease Model] Loading PlantVillage dataset from {DATASET_PATH}")

    # Data augmentation for training
    train_datagen = ImageDataGenerator(
        rescale=1.0/255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        shear_range=0.15,
        fill_mode='nearest',
        validation_split=0.2
    )

    # Get class directories (exclude nested PlantVillage subfolder)
    all_dirs = sorted([d for d in os.listdir(DATASET_PATH)
                      if os.path.isdir(os.path.join(DATASET_PATH, d)) and d != 'PlantVillage'])
    print(f"[Disease Model] Found {len(all_dirs)} classes: {all_dirs}")

    train_generator = train_datagen.flow_from_directory(
        DATASET_PATH,
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='categorical',
        subset='training',
        classes=all_dirs,
        shuffle=True
    )

    val_generator = train_datagen.flow_from_directory(
        DATASET_PATH,
        target_size=(224, 224),
        batch_size=batch_size,
        class_mode='categorical',
        subset='validation',
        classes=all_dirs,
        shuffle=False
    )

    num_classes = len(all_dirs)
    print(f"[Disease Model] Training samples: {train_generator.samples}")
    print(f"[Disease Model] Validation samples: {val_generator.samples}")
    print(f"[Disease Model] Number of classes: {num_classes}")

    # Build MobileNetV2 transfer learning model
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    base_model.trainable = False  # Freeze base layers

    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.3)(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.2)(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    print(f"[Disease Model] Model built. Training for {epochs} epochs...")
    model.summary()

    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(monitor='val_accuracy', patience=3, restore_best_weights=True),
        tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6),
    ]

    # Train
    history = model.fit(
        train_generator,
        epochs=epochs,
        validation_data=val_generator,
        callbacks=callbacks,
        verbose=1
    )

    # Evaluate
    val_loss, val_acc = model.evaluate(val_generator, verbose=0)
    print(f"\n[Disease Model] Validation Accuracy: {val_acc:.4f}")
    print(f"[Disease Model] Validation Loss: {val_loss:.4f}")

    # Save model and class names
    model.save(MODEL_PATH)
    class_names = list(train_generator.class_indices.keys())
    with open(CLASSES_PATH, 'w') as f:
        json.dump(class_names, f)

    print(f"[Disease Model] Model saved to {MODEL_PATH}")
    print(f"[Disease Model] Classes saved to {CLASSES_PATH}")
    print(f"[Disease Model] Class mapping: {train_generator.class_indices}")

    return model, class_names, val_acc


def load_model():
    """Load trained model"""
    try:
        import tensorflow as tf
        if os.path.exists(MODEL_PATH):
            model = tf.keras.models.load_model(MODEL_PATH, compile=False)
            class_names = get_class_names()
            return model, class_names
        else:
            print("[Disease Model] No trained model found. Please run training first.")
            return None, get_class_names()
    except ImportError:
        print("[Disease Model] TensorFlow not available, using simulation mode")
        return None, get_class_names()


def preprocess_image(image_bytes):
    """Preprocess image for CNN input (224x224 normalized)"""
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(image_bytes))
        img = img.convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        return img_array
    except Exception as e:
        print(f"Image preprocessing error: {e}")
        return None


def detect_disease(image_bytes):
    """Run disease detection on crop image using trained CNN"""
    model, class_names = load_model()

    if model is None:
        # No trained CNN model available — return None so router falls back to Gemini
        return None

    predicted_class = None
    confidence = 0.0

    try:
        img_array = preprocess_image(image_bytes)
        if img_array is not None:
            predictions = model.predict(img_array, verbose=0)
            class_idx = int(np.argmax(predictions[0]))
            confidence = float(predictions[0][class_idx]) * 100
            predicted_class = class_names[class_idx]
    except Exception as e:
        print(f"Prediction error: {e}")
        return None

    if predicted_class is None:
        return None

    # Get disease info
    info = DISEASE_INFO.get(predicted_class, {
        'crop': predicted_class.split('_')[0] if predicted_class else 'Unknown',
        'disease': predicted_class.replace('_', ' ') if predicted_class else 'Unknown',
        'severity': 'Medium',
        'description': f'Detected condition: {predicted_class}',
        'symptoms': ['Refer to agricultural expert for detailed symptoms'],
        'treatment': ['Consult with agricultural expert for treatment plan'],
        'prevention': ['Regular crop monitoring', 'Follow good agricultural practices'],
    })

    return {
        "disease": info.get('disease', predicted_class),
        "confidence": round(confidence, 1),
        "crop": info.get('crop', 'Unknown'),
        "severity": info['severity'],
        "description": info['description'],
        "symptoms": info['symptoms'],
        "treatment": info['treatment'],
        "prevention": info['prevention'],
        "predicted_class": predicted_class,
        "model_info": {
            "model": "CNN (MobileNetV2 Transfer Learning)",
            "dataset": "PlantVillage",
            "classes": len(class_names),
            "input_size": "224x224 RGB",
        }
    }


if __name__ == "__main__":
    print("=" * 60)
    print("AgriConnect - CNN Disease Detection Model")
    print("Dataset: PlantVillage")
    print("Architecture: MobileNetV2 + Transfer Learning")
    print("=" * 60)
    classes = get_class_names()
    print(f"\nClasses ({len(classes)}):")
    for i, c in enumerate(classes):
        print(f"  {i}: {c}")
    print(f"\nDataset path: {DATASET_PATH}")
    print(f"Model path: {MODEL_PATH}")
