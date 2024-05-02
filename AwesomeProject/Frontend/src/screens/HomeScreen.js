import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [serverMessage, setServerMessage] = useState('Loading data from server...');

  useEffect(() => {
    fetch('http://10.0.0.63:8080/message')
      .then(response => response.json())
      .then(data => {
        setServerMessage(data.message);
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setServerMessage('Failed to load data');
      });
  }, []);

  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Device Inspection</Text>
      <TouchableOpacity style={styles.button}>
        <Image source={require('../../assets/search-icon.png')} style={styles.icon} />
        <Text>Recall Search</Text>
      </TouchableOpacity>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('FDA')} >
          <Text>FDA Enforcement</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('K510')}>
          <Text>510k</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Maude')}>
          <Text>MAUDE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Abby')}>
          <Text>Abby's Page</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button}>
        <Image source={require('../../assets/camera-icon.png')} style={styles.icon} />
        <Text>Device Recognition</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.footerButton}>
        <Text>Camera</Text>
      </TouchableOpacity>
    
      {/* ... Rest of your buttons and views */}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 200,
      width: width, // Use the full width of the screen
      height: height, // Use the full height of the screen
    },
    header: {
      fontSize: width * 0.05, // Example of responsive font size
      fontWeight: 'bold',
      marginBottom: 150,
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: width * 0.05, // Padding proportional to screen width
      margin: 5,
      borderWidth: 2,
      borderRadius: 5,
      minWidth: width * 0.4, // Minimum width of button
    },
    buttonRow: {
      flexDirection: 'row',
      marginVertical: 20,
    },
    icon: {
      width: width * 0.10, // Set the width relative to screen width
      height: width * 0.10, // Set the height relative to screen width
      margin: 20,
    },
    // Add more styles as needed
  });
// ... Styles remain the same
export default HomeScreen;

