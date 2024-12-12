import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const PredictScreen = () => {
  const [imageUri, setImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [showReturnButton, setShowReturnButton] = useState(false);

  // Select Image Function
  const selectImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        setShowConfirmButton(true);
        setShowReturnButton(false);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  // Upload Image Function
  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert('Please select an image first');
      return;
    }

    setLoading(true);
    setResultImage(null);

    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: 'image/png',
      name: 'image.png',
    });

    try {
      const response = await axios.post(`http://207.254.50.91:5100/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-API-KEY': 'e958665cb568b20d16a8b8f6a40cf3ea5c482e2474a25ad5debf6071b8afd6a3',
        },
        timeout: 30000,
      });

      setResultImage(response.data.result);
      setShowReturnButton(true);
    } catch (error) {
      console.error('Error uploading image:', error.message);
      Alert.alert('Error uploading image');
    } finally {
      setLoading(false);
    }
  };

  // Reset UI Function
  const returnToMain = () => {
    setImageUri(null);
    setResultImage(null);
    setShowConfirmButton(false);
    setShowReturnButton(false);
  };

  return (
    <View style={styles.container}>
      {!imageUri && (
        <>
          <TouchableOpacity
            style={styles.button}
            onPress={selectImage}>
            <Text style={styles.buttonText}>Select Image</Text>
          </TouchableOpacity>
        </>
      )}

      {imageUri && (
        <>
          <Image source={{ uri: imageUri }} style={styles.image} />

          {showConfirmButton && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={uploadImage}>
              <Text style={styles.buttonText}>Confirm</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      {loading && <ActivityIndicator size="large" color="#0000ff" />}

      {resultImage && (
        <Image
          source={{ uri: `data:image/png;base64,${resultImage}` }}
          style={styles.image}
        />
      )}

      {showReturnButton && (
        <TouchableOpacity
          style={styles.returnButton}
          onPress={returnToMain}>
          <Text style={styles.buttonText}>Return</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    margin: 10,
    borderRadius: 5,
  },
  confirmButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    marginTop: 20,
    width: 200,
    borderRadius: 10,
    alignItems: 'center',
  },
  returnButton: {
    backgroundColor: '#F44336',
    padding: 10,
    marginTop: 20,
    width: 150,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  image: {
    width: 300,
    height: 300,
    margin: 20,
    resizeMode: 'contain',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
  },
});

export default PredictScreen;
