import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Dimensions, Linking } from 'react-native';

const { width } = Dimensions.get('window');

const MaudeResultsScreen = ({ route }) => {
    const { results } = route.params;
    console.log("Rendering results:", results); // Log the results to verify

    return (
        <View style={styles.container}>
            <Text style={styles.header}>MAUDE Device Recall Results</Text>
            {results.length === 0 ? (
                <Text>No results found.</Text>
            ) : (
                <FlatList
                    data={results}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <Text style={styles.title}>{item.device.generic_name}</Text>
                            <Text>Manufacturer: {item.manufacturer_name}</Text>
                            <Text>Date Received: {item.date_received}</Text>
                            <TouchableOpacity onPress={() => Linking.openURL(item.report_url)}>
                                <Text style={styles.link}>View Report</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    item: {
        backgroundColor: '#f9c2ff',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
        borderRadius: 5,
    },
    title: {
        fontSize: width * 0.04,
        fontWeight: 'bold',
    },
    link: {
        color: 'blue',
        textDecorationLine: 'underline',
        marginTop: 10,
    },
    // Additional styles
});

export default MaudeResultsScreen;
