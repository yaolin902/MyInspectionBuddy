import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions, Button } from 'react-native';
import Swiper from 'react-native-swiper';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const images = [
    require('../../assets/image1.png'),
    require('../../assets/image2.png'),
    require('../../assets/image3.png'),
    require('../../assets/image4.png'),
    require('../../assets/image5.png'),
    require('../../assets/image6.png'),
    require('../../assets/image7.png'),
  ];

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.appNameContainer}>
        <Text style={styles.appName}>MY INSPECTION BUDDY</Text>
      </View>

      <View style={styles.carouselContainer}>
        <Swiper
          autoplay
          autoplayTimeout={2}
          showsPagination={false}
          loop
          style={styles.wrapper}
        >
          {images.map((image, index) => (
            <View key={index} style={styles.slide}>
              <Image source={image} style={styles.carouselImage} />
            </View>
          ))}
        </Swiper>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.button1]} onPress={() => navigation.navigate('FDA')}>
            <Text style={styles.buttonText}>FDA Enforcement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.button2]} onPress={() => navigation.navigate('K510')}>
            <Text style={styles.buttonText}>510k</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.button3]} onPress={() => navigation.navigate('Maude')}>
            <Text style={styles.buttonText}>MAUDE</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.button4]} onPress={() => navigation.navigate('CDPH')}>
            <Text style={styles.buttonText}>CDPH Medical Device Page</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.button, styles.button5]} onPress={() => navigation.navigate('OpenHistoricalScreen')}>
            <Text style={styles.buttonText}>Historical Documents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.button6]} onPress={() => navigation.navigate('WarningLetterScreen')}>
            <Text style={styles.buttonText}>FDA Warning Letter Database</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.button7]} onPress={() => navigation.navigate('CAEntitySearchScreen')}>
            <Text style={styles.buttonText}>CA Business Entity Search</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.button8]} onPress={() => navigation.navigate('ContactFetchScreen')}>
            <Text style={styles.buttonText}>DA Office Contacts</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.bottomButton} onPress={() => navigation.navigate('PredictScreen')}>
        <Image source={require('../../assets/camera-icon.png')} style={styles.icon} />
        <Text style={styles.buttonText}>Device Detection</Text>
      </TouchableOpacity>

      {/* Add the Logout Button */}
      <Button title="Logout" onPress={logout} color="#FF3366" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingBottom: 50,
    backgroundColor: '#FFFFFF',
  },
  appNameContainer: {
    paddingVertical: 20,
  },
  appName: {
    fontSize: 40,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FF0000', // Red color for the app name
  },
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wrapper: {},
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  carouselImage: {
    width: width * 0.8,
    height: height * 0.2,
    resizeMode: 'contain',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  button: {
    width: width * 0.2,
    height: width * 0.2, // Make buttons more square-shaped
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20, // Rounded edges
    marginHorizontal: 5,
    padding: 10, // Adjust padding for content inside the button
  },
  button1: {
    backgroundColor: '#FFCDD2',
  },
  button2: {
    backgroundColor: '#C8E6C9',
  },
  button3: {
    backgroundColor: '#BBDEFB',
  },
  button4: {
    backgroundColor: '#D1C4E9',
  },
  button5: {
    backgroundColor: '#FFE0B2',
  },
  button6: {
    backgroundColor: '#B2DFDB',
  },
  button7: {
    backgroundColor: '#FFEB3B',
  },
  button8: {
    backgroundColor: '#FFCDD2', 
  },
  buttonText: {
    fontSize: 20,
    color: '#000000',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.9,
    padding: 15,
    backgroundColor: '#E1F5EA',
    borderRadius: 10,
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  icon: {
    width: width * 0.1,
    height: width * 0.1,
    marginRight: 10,
  },
});

export default HomeScreen;
