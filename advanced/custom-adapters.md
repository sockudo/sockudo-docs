# Custom Adapters (Conceptual)

Sockudo's architecture includes a modular **Adapter** system, which is responsible for managing WebSocket connections and, crucially, broadcasting messages between different server instances in a scaled environment. While Sockudo comes with built-in adapters (Local, Redis, Redis Cluster, NATS), its design might allow for the development of custom adapters in the future to support other message brokers or communication backplanes.

**This page serves as a conceptual placeholder. As of the current documentation, specific interfaces or guidelines for creating custom adapters are not yet detailed. The possibility of custom adapters depends on the internal design choices made by the Sockudo developers.**

## Why Create a Custom Adapter?

You might consider creating a custom adapter if:

* You want to integrate Sockudo with a message broker not currently supported (e.g., Kafka, RabbitMQ, a specific cloud provider's messaging service).
* You have unique requirements for inter-node communication or state management that existing adapters don't cover.
* You want to experiment with different transport protocols or strategies for message broadcasting.

## Potential Adapter Responsibilities

A custom adapter in a system like Sockudo would likely need to implement a defined Rust trait (interface) that outlines responsibilities such as:

* **Initialization**: Setting up connections to the chosen backend/broker.
* **Connection Management**:
    * Handling new client WebSocket connections associated with the adapter.
    * Tracking disconnections and performing cleanup.
* **Namespace and Channel Management**:
    * Adding a connection to a specific namespace (app).
    * Subscribing a connection to one or more channels within its namespace.
    * Unsubscribing a connection from channels.
* **Message Broadcasting**:
    * `publish(namespace_id, channel_name, message_payload)`: Publishing a message from the current Sockudo instance to the backend/broker so other instances can receive it.
    * `on_message(callback)`: A mechanism to receive messages from the backend/broker (published by other Sockudo instances) and then relay them to locally connected clients on the appropriate channels.
* **Health Checks/Status**: Reporting the adapter's status.
* **Cleanup/Shutdown**: Gracefully closing connections and releasing resources.
* **Presence Logic (Potentially)**: Some adapters might need specific logic to handle the distribution and synchronization of presence channel data (member lists) if not handled at a higher layer.

## Developing a Custom Adapter (Hypothetical Steps)

If Sockudo exposes a clear trait for adapters, the process might look like this:

1.  **Understand the Adapter Trait**: Study the Rust trait definition provided by Sockudo for adapters. This will define all the methods your custom adapter must implement.
2.  **Choose Your Backend**: Select the message broker or communication system you want to integrate with.
3.  **Implement the Trait**:
    * Create a new Rust struct for your adapter.
    * Implement the required methods from Sockudo's adapter trait. This will involve using client libraries for your chosen backend to send and receive messages.
    * Handle connection logic, message serialization/deserialization, and error handling.
4.  **Configuration**:
    * Add a new variant to the `AdapterDriver` enum in `src/options.rs` for your custom adapter.
    * Add a new configuration struct in `src/options.rs` to hold settings specific to your adapter (e.g., connection URLs, credentials for your chosen backend).
    * Update the `AdapterFactory` in `src/adapter/factory.rs` to instantiate your custom adapter when its driver type is selected in the configuration.
5.  **Testing**: Thoroughly test your adapter, especially in a multi-node Sockudo setup, to ensure reliable message delivery, presence updates, and correct handling of connection/disconnection scenarios.
6.  **Contribution (Optional)**: If you develop a robust and generally useful adapter, consider contributing it back to the Sockudo project.

## Current Status

Please refer to Sockudo's official source code (particularly in the `src/adapter/` directory and `src/options.rs`) and any explicit developer documentation or contribution guidelines to see if creating custom adapters is a supported extension point and what the defined interfaces are.

If you are interested in developing a custom adapter, engaging with the Sockudo maintainers through GitHub issues or discussions would be a good first step to understand feasibility and best practices.
