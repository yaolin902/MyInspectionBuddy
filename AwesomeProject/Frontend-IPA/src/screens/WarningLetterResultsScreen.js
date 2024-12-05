import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Linking } from 'react-native';

const WarningLetterResultsScreen = ({ route }) => {
    const { results } = route.params;

    console.log("Results received:", results);  // Log the received results

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            <Text style={styles.title}>{item.LegalName}</Text>
            <Text style={styles.text}>Action Taken Date: {item.ActionTakenDate}</Text>
            <Text style={styles.text}>Action Type: {item.ActionType}</Text>
            <Text style={styles.text}>State: {item.State}</Text>
            <Text style={styles.text}>Case Injunction ID: {item.CaseInjunctionID}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(item.warning_letter_url)}>
                <Text style={styles.link}>View Warning Letter</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={results}
                renderItem={renderItem}
                keyExtractor={(item) => item.CaseInjunctionID}
                ListEmptyComponent={<Text>No warning letters found.</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
    },
    itemContainer: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    text: {
        fontSize: 16,
    },
    link: {
        fontSize: 16,
        color: 'blue',
        marginTop: 10,
    },
});

export default WarningLetterResultsScreen;
