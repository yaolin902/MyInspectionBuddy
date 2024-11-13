import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Linking } from 'react-native';
import { BACKEND_URL } from '../../config.js';

const ContactFetchScreen = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/contacts`);
        const result = await response.json();
        setContacts(result);
        setLoading(false);
        console.log('Fetched contacts:', result);
        if (result.length === 0) {
          Alert.alert('No contacts found');
        }
      } catch (error) {
        setLoading(false);
        Alert.alert('Error', 'Error fetching contacts');
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, []);

  const openLink = (url) => {
    Linking.openURL(url).catch(err => {
      console.error("Failed to open URL:", err);
      Alert.alert('Error', 'Failed to open the link');
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>District Attorney Office Contacts</Text>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.contactItem}>
            <Text style={styles.contactText}>County: {item.county}</Text>
            <Text style={styles.contactText}>Name: {item.name}</Text>
            <Text style={styles.contactText}>Address: {item.address}</Text>
            <Text style={styles.contactText}>Phone: {item.phone}</Text>
            <Text style={styles.contactText}>Fax: {item.fax}</Text>
            <TouchableOpacity onPress={() => openLink(item.link_to_website)}>
              <Text style={styles.linkText}>Website: {item.link_to_website}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  contactItem: {
    flexDirection: 'column',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
  },
  contactText: {
    fontSize: 16,
  },
  linkText: {
    fontSize: 16,
    color: 'blue',
    textDecorationLine: 'underline',
  },
});

export default ContactFetchScreen;
