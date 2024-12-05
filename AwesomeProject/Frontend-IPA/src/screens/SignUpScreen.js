import React, { useState } from 'react';
import { View, TextInput, Button, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../config.js';
import { logQuery } from './HomeScreen';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const login = async () => {
    logQuery("UserSignUp");
    try {
      const response = await axios.post(`${BACKEND_URL}/login`, { username, password });
      await AsyncStorage.setItem('access_token', response.data.access_token);
      navigation.navigate('Home');
    } catch (error) {
      setMessage('Invalid credentials');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logoText}>MY INSPECTION BUDDY</Text>
      <Image source={require('../../assets/splash.png')} style={styles.logoImage} />
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor="#888"
      />
      <TouchableOpacity>
        <Text style={styles.forgotPassword}>Forgot password?</Text>
      </TouchableOpacity>
      <Button title="Log In" onPress={login} color="#FF3366" />
      <TouchableOpacity onPress={() => navigation.navigate('signUp')}>
        <Text style={styles.signUp}>Sign up</Text>
      </TouchableOpacity>
      {message ? <Text style={styles.message}>{message}</Text> : null}
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
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 30,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 25,
    backgroundColor: '#2A2A2A',
    marginBottom: 20,
    color: '#FFFFFF',
  },
  forgotPassword: {
    color: '#888',
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  signUp: {
    color: '#FF3366',
    marginTop: 20,
  },
  message: {
    color: '#FF3366',
    marginTop: 20,
  },
});

export default LoginScreen;
