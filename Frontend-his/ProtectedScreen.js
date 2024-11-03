import React, { useEffect, useState } from 'react';
import { View, Button, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProtectedScreen = ({ navigation }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProtectedData = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        navigation.navigate('Login');
        return;
      }

      try {
        const response = await axios.get('http://<your-flask-backend>/protected', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage(response.data.logged_in_as.username);
        setLoading(false);
      } catch (error) {
        setMessage('You are not logged in');
        setLoading(false);
        navigation.navigate('Login');
      }
    };
    fetchProtectedData();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('access_token');
    navigation.navigate('Login');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FF3366" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.message}>Welcome, {message}</Text>
      <Button title="Logout" onPress={logout} color="#FF3366" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  message: {
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 20,
  },
});

export default ProtectedScreen;
