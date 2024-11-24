using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using System.Linq;

public class EggController : MonoBehaviour
{
    private bool isCollected = false;
    private Material originalMaterial;
    private Renderer eggRenderer;
    private Color originalColor;
    private Rigidbody rb;
    
    // Add materials for different states
    private Color greenColor = new Color(0f, 1f, 0f, 1f);
    private Color redColor = new Color(1f, 0f, 0f, 1f);
    
    // Static list to track all active eggs
    private static List<EggController> activeEggs = new List<EggController>();
    
    // Set to store already processed message IDs
    private HashSet<string> processedMessages = new HashSet<string>();
    
    // Message class to track propagation
    private class EggMessage
    {
        public string MessageId { get; private set; }
        public Vector3 OriginPosition { get; private set; }
        public float TimeStamp { get; private set; }
        public bool IsHostile { get; private set; }

        public EggMessage(Vector3 origin, bool isHostile)
        {
            MessageId = System.Guid.NewGuid().ToString();
            OriginPosition = origin;
            TimeStamp = Time.time;
            IsHostile = isHostile;
        }
    }

    void Start()
    {
        eggRenderer = GetComponent<Renderer>();
        originalMaterial = eggRenderer.material;
        originalColor = originalMaterial.color;
        rb = GetComponent<Rigidbody>();
    }

    void OnEnable()
    {
        // Add this egg to the active eggs list
        activeEggs.Add(this);
    }

    void OnDisable()
    {
        // Remove this egg from the active eggs list
        activeEggs.Remove(this);
    }

    void OnTriggerEnter(Collider other)
    {
        // Handle ocean collision
        if (other.CompareTag("Ocean"))
        {
            if (rb != null)
            {
                rb.useGravity = false;
                rb.velocity = Vector3.zero;  // Stop any movement
            }
            return;
        }

        // Existing bird collision logic
        if (!isCollected && (other.gameObject.CompareTag("Bird") || other.gameObject.CompareTag("BirdEnemy")))
        {
            isCollected = true;
            bool isHostile = other.gameObject.CompareTag("BirdEnemy");
            StartCoroutine(ChangeColorTemporarily(isHostile));
            
            // Create and propagate new message
            PropagateMessage(new EggMessage(transform.position, isHostile));
        }
    }

    private void PropagateMessage(EggMessage message)
    {
        // If we've already processed this message, ignore it
        if (processedMessages.Contains(message.MessageId))
        {
            return;
        }

        // Process the message
        processedMessages.Add(message.MessageId);
        StartCoroutine(ChangeColorTemporarily(message.IsHostile));

        // Get 6 nearest neighbors
        var nearestNeighbors = activeEggs
            .Where(egg => egg != this)
            .OrderBy(egg => Vector3.Distance(transform.position, egg.transform.position))
            .Take(6);

        // Propagate to neighbors
        foreach (var neighbor in nearestNeighbors)
        {
            StartCoroutine(DelayedPropagate(neighbor, message, 0.1f));
        }

        // Clean up old message IDs periodically
        StartCoroutine(CleanupOldMessage(message.MessageId, 5f));
    }

    private IEnumerator DelayedPropagate(EggController neighbor, EggMessage message, float delay)
    {
        yield return new WaitForSeconds(delay);
        neighbor.PropagateMessage(message);
    }

    private IEnumerator CleanupOldMessage(string messageId, float delay)
    {
        yield return new WaitForSeconds(delay);
        processedMessages.Remove(messageId);
    }

    IEnumerator ChangeColorTemporarily(bool isHostile)
    {
        if (isHostile)
        {
            // Create a new material that preserves the original alpha
            Material newMaterial = new Material(originalMaterial);
            newMaterial.color = redColor;
            eggRenderer.material = newMaterial;

            yield return new WaitForSeconds(0.1f);

            // Restore original material color
            eggRenderer.material.color = originalColor;
            isCollected = false;
        }
    }

    public bool IsCollected()
    {
        return isCollected;
    }

    void OnDrawGizmos()
    {
        // Set the color for the debug lines
        Gizmos.color = new Color(1f, 1f, 1f, 0.1f);

        // Create a list of eggs sorted by distance
        var sortedEggs = activeEggs
            .Where(egg => egg != this)
            .OrderBy(egg => Vector3.Distance(transform.position, egg.transform.position))
            .Take(6);

        // Draw lines to the 6 closest eggs
        foreach (var otherEgg in sortedEggs)
        {
            Gizmos.DrawLine(transform.position, otherEgg.transform.position);
        }
    }
}