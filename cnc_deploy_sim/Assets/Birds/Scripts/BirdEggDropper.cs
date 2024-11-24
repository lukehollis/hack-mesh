using UnityEngine;

public class BirdEggDropper : MonoBehaviour
{
    public GameObject eggPrefab;
    public float dropInterval = 2f;
    private float timeSinceLastDrop;
    private BirdController birdController;

    void Start()
    {
        birdController = GetComponent<BirdController>();
        timeSinceLastDrop = 0f;
    }

    void Update()
    {
        timeSinceLastDrop += Time.deltaTime;

        if (timeSinceLastDrop >= dropInterval)
        {
            DropEgg();
            timeSinceLastDrop = 0f;
        }
    }

    void DropEgg()
    {
        if (eggPrefab != null)
        {
            // Use the bird's current position to spawn the egg
            Vector3 spawnPosition = transform.position;
            
            // Instantiate the egg slightly below the bird
            spawnPosition.y -= 0.5f;
            
            GameObject egg = Instantiate(eggPrefab, spawnPosition, Quaternion.identity);
            
            // Enable gravity on the spawned egg
            Rigidbody rb = egg.GetComponent<Rigidbody>();
            if (rb != null)
            {
                rb.useGravity = true;
            }
        }
        else
        {
            Debug.LogWarning("Egg prefab not assigned to BirdEggDropper!");
        }
    }
}